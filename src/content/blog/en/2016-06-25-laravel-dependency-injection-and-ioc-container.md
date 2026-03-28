---
layout: post
title: "Laravel: Dependency injection and the IoC container"
date: 2016-06-25 10:20 PM
categories: [web-backend]
author: hungneox
description: "Laravel: dependency injection and the IoC container"
image: /assets/images/laravel.jpg
comments: true
---

!["Laravel"](/assets/images/laravel.jpg "Laravel")

# Table of contents

1. [What is dependency injection?](#dependency-injection)
2. [What is an IoC container?](#ioc-container)
3. [How do you use the IoC container in Laravel?](#using-ioc-in-laravel)
4. [Conclusion](#conclusion)

# 1. What is dependency injection? {#dependency-injection}

In short, **dependency injection** (DI) means giving an object the other objects it depends on (**dependencies**) from the outside, instead of constructing them inside the constructor. That makes the application more flexible and easier to test, because you can swap in mock implementations.

Here is a generic example **without** DI:

```php
<?php
class StandardLogger {

    public function info($message)
    {
      printf("[INFO] %s \n", $message);
    }
}

class MyLog {
    public $logger;

    public function __construct() {
        $this->logger = new StandardLogger();
    }

    public function info($string)
    {
        return $this->logger->info($string);
    }
}

// Main application, somewhere else
$myLog = new MyLog();
$myLog->info('This object depend on another object');
```

The example is illustrative, but the point is that `MyLog` depends on `StandardLogger`. In other words, `MyLog` is tightly coupled to `StandardLogger`. If you want to switch to another logger (say `FileLogger` or `MongoDBLogger`), you have to change `MyLog`’s constructor.

To fix that dependency, you only need to change `MyLog`’s constructor to accept a logger parameter—often called **decoupling** `MyLog` from the concrete classes it depends on. That pattern is **dependency injection**. Tah-dah—simple, right? Hence the joke that DI is a twenty-five-dollar name for a five-cent idea. From [James Shore](http://www.jamesshore.com/Blog/Dependency-Injection-Demystified.html):

> "Dependency Injection" is a 25-dollar term for a 5-cent concept. [...] Dependency injection means giving an object its instance variables. [...].

```php
<?php
interface LoggerInterface 
{
    function info($message);
}

class StandardLogger implements LoggerInterface
{

    public function info($message)
    {
        printf("[INFO] %s \n", $message);
    }
}

class FileLogger implements LoggerInterface 
{

    public function info($message) 
    {
        file_put_contents('app.log', sprintf("[INFO] %s \n", $message), FILE_APPEND);
    }
}

class MyLog 
{
    public $logger;

    public function __construct(LoggerInterface $logger) 
    {
        $this->logger = $logger;
    }

    public function info($string)
    {
        return $this->logger->info($string);
    }
}
// Print to standard output
$myLog = new MyLog(new StandardLogger);
$myLog->info('This object depend on another object');
// Write to file
$myFileLog = new MyLog(new FileLogger);
$myFileLog->info('This object depend on another object'); 
```
# 2. What is an IoC container? {#ioc-container}

Once you adopt DI, another question appears: how do you know which classes `MyLog` depends on in order to construct it? Creating a `MyLog` instance is easy if it only depends on one other class directly. But dependencies can nest—for example `MyLog → DBLogger → DatabaseAccess`—which makes constructing the object you need painful, because the dependency graph can get very deep.

To solve that, people introduced the **dependency injection container**, also called an **Inversion of Control** (IoC) container. *Inversion of Control* is the broader term; in what follows I will say **IoC container** instead of “dependency injection container.” In essence, an IoC container is a map or a switchboard: it knows which classes depend on which others and can resolve those classes using [PHP reflection](http://php.net/manual/en/book.reflection.php), or from bindings the developer registered ahead of time.

DI is not a new idea—especially in the Java world. Martin Fowler wrote about the [dependency injection pattern and IoC containers in 2004](http://martinfowler.com/articles/injection.html). The phrase *inversion of control* goes back at least to 1988 in Johnson and Foote’s paper [“Designing Reusable Classes”](http://www.laputan.org/drc/drc.html). Only more recently have PHP frameworks such as [Laravel](https://laravel.com/docs/4.2/ioc) and [Pimple](http://pimple.sensiolabs.org/) popularized DI and IoC containers. From Laravel 5.0 onward, Laravel calls this the **service container** instead of IoC container.

Laravel started as an IoC container project for CodeIgniter, written by Taylor Otwell, named **CInject**. According to Taylor, parts of it were reused all the way into Laravel 5.x. At its core, Laravel **is** an IoC container—the concrete class is `Illuminate\Container\Container`.

!["Screenshot of the CInject project on Google Code"](/assets/posts/laravel-dependency-injection-va-ioc-container/cinject.png "Screenshot of the CInject project on Google Code")


# 3. How do you use the IoC container in Laravel? {#using-ioc-in-laravel}

## Basic

Take a simple example of two levels of dependencies for a class.

```php
<?php
class Car {
    public $enigne;
    public function __construct(Engine $enigne) {
        $this->enigne = $enigne;
    }
}
class Engine {
    public $piston;
    public function __construct(Piston $piston) {
        $this->piston = $piston;
    }
}
class Piston {}
```

If you try `$car = new Car();`, PHP errors with:

```
Argument 1 passed to Car::__construct() must be an instance of Engine, none given,...
```

That makes sense: `Car` needs `Engine`, which needs `Piston`. In Laravel, if you use `App::make`, the IoC container resolves `Car`’s dependencies automatically and builds `$car` for you.

```php
<?php
$car = App::make('Car');

dd($car);

// Output
Car {#212 ▼
  +enigne: Engine {#216 ▼
    +piston: Piston {#218}
  }
}
```

Back to the `MyLog` example. If you create `MyLog` with `App::make('MyLog')`, Laravel responds with:

```
Target [LoggerInterface] is not instantiable.
```

That is expected: `MyLog`’s constructor type-hints an **interface**, not a concrete class, so Laravel cannot instantiate the interface and inject it. The IoC container is not *smart* enough to guess which implementation you want—you must bind `LoggerInterface` to a concrete class.

For example:

```php
<?php
App::bind('LoggerInterface', 'StandardLogger');

$myLog = App::make('MyLog');

dd($myLog);
// Output
MyLog {#212 ▼
  +logger: StandardLogger {#214}
}
```
## Contextual binding

Sometimes two different classes share one interface but need two different implementations. Suppose you add `ExceptionLog` and want it to log to a file while `MyLog` still prints to standard output.

```php
<?php
class ExceptionLog 
{
    public $logger;

    public function __construct(LoggerInterface $logger) 
    {
        $this->logger = $logger;
    }

    public function info(\Exception $ex)
    {
        return $this->logger->info($ex->getMessage());
    }
}
```

Laravel’s IoC container supports **contextual binding**: bind the interface a class needs to a specific implementation depending on context.

```php
<?php
App::when('MyLog')
    ->needs('LoggerInterface')
    ->give('StandardLogger');

App::when('ExceptionLog')
    ->needs('LoggerInterface')
    ->give('FileLogger');

$mylog = App::make('MyLog');
$exceptionLog = App::make('ExceptionLog');

dump($mylog);
dump($exceptionLog);
// Output

MyLog {#211 ▼
  +logger: StandardLogger {#213}
}

ExceptionLog {#212 ▼
  +logger: FileLogger {#215}
}
```
## Repository pattern

One practical, important use of the IoC container in Laravel is trimming **fat controllers** and decoupling controllers from business logic. The controller should orchestrate data between the view and the model.

Consider this example:

```php
<?php
class MovieController extends Controller {
    
    use FormBuilderTrait;

    public function doUpsert(Request $request, $id = null)
    {
        $form = $this->form(\App\Forms\MovieForm::class);

        if (!$form->isValid()) {
           return redirect()->back()->withErrors($form->getErrors())->withInput();
         }
        // Tightly coupled to Eloquent model
        $movie = (empty($id)) ? new Movie : Movie::find($id);
        $movie->fill($request->all());
        $movie->user()->associate(Auth::user());
        $movie->save();

        return redirect()->route('admin.movies');
    }
}
```

At first glance it looks fine, but it is tightly coupled to the Eloquent model and everything happens in the controller. That makes the app hard to test, and switching to MongoDB would mean ripping most of it out.

With the **repository pattern** and the IoC container, you get a more flexible setup. You can swap implementations of `MovieRepositoryInterface`—Eloquent for Doctrine, or a NoSQL store instead of a relational database—without rewriting everything. You only change the binding for `MovieRepositoryInterface` in `AppServiceProvider`; the rest of the code depends on the contract, not the concrete implementation.

```php
<?php
// AppServiceProvider
$this->app->bind(
    'App\Contracts\MovieRepositoryInterface',
    'App\Repositories\MovieRepository'
);

class MovieController extends Controller {
    
    use FormBuilderTrait;

    public function __construct(\App\Contracts\MovieRepositoryInterface $movie) 
    {   
        // Decoupled controller from Eloquent model
        $this->movie = $movie;
    }

    public function doUpsert(Request $request, $id = null)
    {
        $form = $this->form(\App\Forms\MovieForm::class);

        if (!$form->isValid()) {
            return redirect()->back()->withErrors($form->getErrors())->withInput();
        }

        if (empty($id)) {
            $this->movie->create(Auth::user()->id, $request->all(), $request);
        } else {
            $this->movie->update($id, Auth::user()->id, $request->all(), $request);
        }

        return redirect()->route('admin.movies');
    }
}
```
# 4. Conclusion {#conclusion}

Dependency injection and the IoC container are simple ideas. Still, you should understand when and how they apply. Used well, they make code **loosely coupled**, easier to maintain, and easier to test. Personally, I see the IoC container as the heart of Laravel and one of its biggest differences from other PHP frameworks. Understanding it also helps you structure Laravel apps in a cleaner, more effective way.


# References 

1. [Inversion of Control Containers and the Dependency Injection pattern](http://martinfowler.com/articles/injection.html) — Martin Fowler.
2. [Back to basics: OOP, Dependency Injection, and the Cake pattern](http://kipalog.com/posts/Tro-lai-voi-co-ban--OOP--Dependency-Injection-va-Cake-Pattern) — Kipalog (Vietnamese).
3. [Dependency Injection Demystified](http://www.jamesshore.com/Blog/Dependency-Injection-Demystified.html) — James Shore.
4. [Laravel — Lessons learned (php[world] 2015, Taylor Otwell)](https://www.youtube.com/watch?v=xKefsl_UiM0) — YouTube.
5. [Service container — contextual binding](https://laravel.com/docs/container#contextual-binding) — Laravel documentation.
