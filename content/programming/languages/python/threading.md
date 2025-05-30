---
title: How threading works in Python
description: A deep dive into the internals of threading in Python
tags: [notes]
published: 2024-04-07T14:08:09-04:00
---

- Python threading by default is the worst of both words. In its current form, it sucks, completely.
- Threads are **concurrent** but not **parallel**. Each thread created also corresponds with an os thread (pthreads on unix, for example), but only one "thread" can perform work at a given time.
- This is due to the **Global Interpreter Lock** (GIL), which only allows one thread to run at every given time.
  - Despite the Global Interpreter Lock, it does not guarantee safety. Operations in Python in general, are not guaranteed atomic.
  - For example: the statement `x += 1` invokes multiple different bytecode instructions, the GIL may pause the thread in the middle of execution of this statement and other threads can observe the state beforehand, leading to data races and "undefined behavior".
    - In this case, the GIL is _preemptive_ multithreading not _cooperative_ multithreading. This is also similar to how OS threads operate. But in this case, the GIL doesn't necessarily control when threads run, the OS does, but it does control the _lock_ that determines whether threads can run.
    - The OS and the GIL often have orthogonal interests when it comes to determining which thread gets to run!
      - OSes obviously do not want to let programs determine when their threads get to run (cooperative), as the OS has a broader view of all the various programs on a system asking for resources and needs to properly schedule everything.
      - Note: OSes _do_ have a form of cooperative multithreading, called _fibers_. I don't know much about them. I hope someday I do!
    - [Reference](https://stackoverflow.com/questions/33352298/how-does-python-handle-thread-locking-context-switching), [Another Reference](https://verdagon.dev/blog/python-data-races).
  - Note that the Global Interpreter Lock is **not** part of the Python specification. It's part of the reference implementation, CPython, but there are several Python interpreters (such as [IronPython](https://github.com/IronLanguages/ironpython3), based on .NET) that do not use a GIL at all (in the case of IronPython, the synchronization is done by the underlying .NET runtime).
  - There are efforts to remove the GIL, culminating in [PEP 703](https://peps.python.org/pep-0703/), which has been accepted, and will make the GIL optional in Python 3.13.
    - This does come at a reduction to single-threaded performance (estimates ~10%), but there are already initiatives to increase Python's speed ([Faster CPython Team](https://devblogs.microsoft.com/python/python-311-faster-cpython-team/)) so the net impact is likely negligible per release.
    - `nogil` Python may become the default in the future. It doesn't affect Pure python code (since as I've pointed out, the GIL doesn't prevent data races), but CPython extensions will need to be recompiled.
      - Most CPython code is heavily optimized and doesn't necessarily assume a GIL context (does the synchronization) by itself, so this won't require huge rewrites, in general. It does require a recompilation on the right ABI.
      - Note: Python wants to avoid a 2->3 fiasco again which very nearly killed the entire language, so the design is conservative to ensure that gil->nogil won't break existing code. If it detects code that relies on the GIL, it will automatically switch to a GIL context.
- Threads aren't necessarily pinned to core (TODO: Find more information about this), so this invokes context switches, even if `nthreads < ncores`. [Reference](https://discuss.python.org/t/python-context-switching-how-is-it-done/8635).
  - Context-switching is expensive! The speed of IO has increased tremendously with technologies like NVME, etc.
  - If a thread gets moved to a different core, that can invoke cache misses. The thread context will get "serialized" then "deserialized" on the core for execution.
  - This can be mitigated by a `ThreadPool` (which is recommended anyways in nearly all sort of multithreaded programming in all languages, since the creation and destruction of threads are expensive).
- Async Python partially mitigates the preemptive-ness of the GIL, instead with cooperative multithreading as functions can signal when to give up control with an `await`.
  - However, Async Python is still single-threaded. The way tasks are run is agnostic to _how_ they're run, its an implementation detail.
    - Though in practice, we can't have a mulithreaded executor in Python.
  - Python futures are defined by the coroutine, which is very similar to Rust's `futures`! It's just a function that's transformed into a finite state machine.
  - [`uvloop`](https://github.com/MagicStack/uvloop), for example, is an async runtime based on `libuv` (which powers Node.js) that makes the default `asyncio` runtime much faster. I believe it's multithreaded (don't quote me on this!)
- However, in Python code that interfaces with the "outside world" (ie. Cython, Pyo3, etc.) is allowed to release the GIL.
  - This is prevalent in numpy, tensforflow, etc. Python is kinda a glorified bash here, with the actual work being deferred to the underlying "low-level" code.
  - Read/write/IO functions often do release the GIL (since the "Pure Python" in this case is just CPython which is doing syscalls, etc).
  - So in practice, we can get "true multithreading" in Python. But you don't get to control the semantics of when this multithreading occurs, it's done when the program essentially feels liek it.
- Multiprocessing is the alternative for people who want **parallel** execution, as in this case, the Python Interpreter _forks_ itself and provides an ergonomic API over this.
  - Each Interpreter gets its own GIL, so multiple interpreters can run code at the same time.
    - Theoretically, you can do _multithreading_ per _multiprocess_, but I haven't explored the ergonomics of this or if it even really makes sense.
  - However, each process has its own separate address space, which can be _very_ expensive.
    - Similar to `ThreadPool`s, `ProcessPool`s mitigate the creation and destruction of separate address spaces.
  - Processes have to communicate via IPC. Python makes this transparent-_ish_ to you, by sharing objects between threads by [pickling them](https://laszukdawid.com/blog/2017/12/13/multiprocessing-in-python-all-about-pickling/).
    - This can suck. The most obvious reason is that deserializing and serializing an object invokes a real run-time cost.
    - It also means that for objects that can't/don't be pickled, you need to define your own custom logic for sending it across processes, while you don't care with threads.
    - Arguably, Python's ergonomics here are not really correct, and it abstracts the real complexity away from the user. But I digress.
- In short: Python is not well-suited for true parallel workloads. In the current form of Python (as of 3.12), it is impossible to run _truly parallel_ workloads in "pure" Python.
