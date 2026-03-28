---
layout: post
title: "SOLID: five principles of object-oriented design"
date: 2016-07-19 2:10 AM
categories: [programming]
author: hungneox
description: "Core SOLID principles with examples"
image: /assets/images/solid.jpg
comments: true
alternate:
  lang: vi
  slug: 2016-07-19-solid-5-nguyen-tac-cua-thiet-ke-huong-doi-tuong
---

!["SOLID principles"](/assets/images/solid.jpg "SOLID principles")

# 0. Table of contents

1. Single responsibility principle
2. Open/closed principle
3. Liskov substitution principle
4. Interface segregation principle
5. Dependency inversion principle

# 1. Single responsibility principle

Informally: one responsibility per unit.

The single-responsibility principle says each class or method should have **one and only one** job (i.e. one reason to change). It is easy to violate: a `User` class might validate email, handle login, send mail, and so on. Classes that do too much are often called **god objects**.

[Robert C. Martin](https://en.wikipedia.org/wiki/Robert_Cecil_Martin) introduced this idea (*Principles of Object Oriented Design*). He defines “responsibility” as **a reason to change**:

> In the context of the Single Responsibility Principle (SRP) we define a responsibility to be “a reason for change.” If you can think of more than one motive for changing a class, then that class has more than one responsibility. — [Bob Martin](http://butunclebob.com/ArticleS.UncleBob.PrinciplesOfOod)

For methods, the rule is usually easier to apply. In a game, a collision check (say `detectCollision()`) should not update the player’s score; if it does anything beyond detecting collisions, it breaks SRP.

# 2. Open/closed principle

Informally: open for extension, closed for modification.

> Software entities (classes, modules, functions, etc.) should be open for extension, but closed for modification.

In practice: design classes and functions so behavior can be **extended** (subclassing, composition, plugins) without **editing** existing source for every new feature. Later developers add functionality by extending what is there instead of patching core code.

That limits re-testing of untouched code and reduces *side effects*. On large codebases, small edits can trigger domino failures.

Below is a **strategy** pattern sketch:

```php
<?php
interface GreetingStrategyInterface
{
    function greet($name);
}

class EnglishGreetingStrategy implements GreetingStrategyInterface
{
    function greet($name)
    {
        printf("Hello, %s", $name);
    }
}

class VietnameseGreetingStrategy implements GreetingStrategyInterface
{
    function greet($name)
    {
        printf("Xin chào, %s", $name);
    }
}

class GreetingContext
{
    private $greetingStategy = null;

    public function __construct($context)
    {
        switch($context)
        {
            case "Vietnamese":
                $this->greetingStategy = new VietnameseGreetingStrategy();
                break;
            case "English":
                $this->greetingStategy = new EnglishGreetingStrategy();
                break;
            default:
                $this->greetingStategy = new EnglishGreetingStrategy();
                return;
        }
    }

    public function greet($name)
    {
        $this->greetingStategy->greet($name);
    }
}

$vnGreeter  = new GreetingContext("Vietnamese");
$enGreeter  = new GreetingContext("English");

$vnGreeter->greet("thế giới!");
$enGreeter->greet("World!");
//Xin chào, thế giới!
//Hello, World!
```

# 3. Liskov substitution principle

Informally: subtypes must be substitutable for their base types.

> The Liskov substitution principle (LSP) states that objects should be replaceable with instances of their subtypes without altering the correctness of that program.

In short: if code depends on an interface, you should be able to swap implementations without changing callers.

This example matches the earlier logging post: `StandardLogger` and `FileLogger` both implement the same interface and can be exchanged without editing `MyLog`.

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
// Print to standard input/output device
$myLog = new MyLog(new StandardLogger);
$myLog->info('This object depend on another object');
// Write to file
$myFileLog = new MyLog(new FileLogger);
$myFileLog->info('This object depend on another object'); 
```

# 4. Interface segregation principle

Informally: small, focused interfaces.

> The interface-segregation principle (ISP) states that no client should be forced to depend on methods it does not use.

Implementations should not be saddled with methods they never call. Prefer several small interfaces over one **fat** interface where every implementer carries **dead** methods.

In **Laravel: From Apprentice To Artisan**, Taylor Otwell discusses `SessionHandlerInterface`:

```php
<?php
interface SessionHandlerInterface
{
    public function close();
    public function destroy($sessionId);
    public function gc($maxLifeTime);
    public function open($savePath, $name);
    public function read($sessionId);
    public function write($sessionId, $sessionData);
}
```

That shape looks fine at first, but concrete drivers may not need `open`, `close`, or `gc`. With Memcached, sessions expire on their own—you might not implement `gc` at all. A better design splits responsibilities into smaller interfaces focused on cohesive behavior, for example:

```php
<?php
interface GarbageCollectorInterface
{
    public function gc($maxLifeTime);
}
```

# 5. Dependency inversion principle

Informally: depend on abstractions, not concrete details.

> The dependency inversion principle (DIP) states that high-level code should not depend on low-level code, and that abstractions should not depend upon details.

Roughly: **low-level** code sits close to the machine—database drivers, file I/O, sockets. **High-level** code encodes business rules and orchestrates lower layers.

DIP says high-level modules should not depend directly on low-level details. They should depend on **abstractions** that hide those details.

Consider a flawed `Authenticator` that talks straight to MySQL and hashes passwords with `md5`. That couples high-level authentication to both storage and hashing—violating DIP.

```php
<?php
class Authenticator
{
    public function __construct(DatabaseConnection $db)
    {
        $this->db = $db;
    }

    public function findUser($id)
    {
        return $this->db->exec("select * from users where id = ?", array($id));
    }

    public function authenticate($credentials)
    {
        //Authenticate the users
    }
}
```

Instead, inject collaborators behind interfaces. You can swap MySQL for another store, or OAuth providers, and replace `md5` with a stronger hasher—without rewriting the core class.

```php
<?php
class Authenticator
{
    public function __construct(UserProviderInterface $users,
                                HasherInterface $hash)
    {
        $this->users = $users;
        $this->hash = $hash;
    }
}
```

For more on dependency inversion and injection, see the earlier post [Laravel: Dependency injection and the IoC container](/en/blog/2016-06-25-laravel-dependency-injection-and-ioc-container/).

# Conclusion

SOLID helps you build larger systems that are easier to extend and maintain—but it asks for more abstraction, more interfaces, and more typing. Some people call that **too much Java**. That critique fits tiny, throwaway scripts. Real products usually grow. Having to scale thoughtfully is a **nice problem to have**. These ideas are not new, yet they still give working programmers a shared vocabulary for maintainable OO design (functional purists excepted :grin:).

# References

1. Kristopher Wilson, *The Clean Architecture in PHP*, [https://leanpub.com/cleanphp](https://leanpub.com/cleanphp)
2. Taylor Otwell, *Laravel: From Apprentice To Artisan*, [https://leanpub.com/laravel](https://leanpub.com/laravel)
