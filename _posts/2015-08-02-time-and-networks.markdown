---
layout: post
title:  "Time, Clocks, and Thoughts on Stateful Protocols"
date:   2015-08-02 16:19:57
categories: jekyll update
---

Over the past several months I have been working on a software application that requires an embedded device to be controlled remotely over the web. It has been a fun and challenging project, and has led me to explore many new areas of software engineering. I ran into some  issues with certain parts which led me to some subtle, but also fundamental realizations about the nature of distributed systems and how to think about them properly. I wanted to outline some of the problems I came across and some of the things I have learned, because I feel like they have been useful to me. 

### The System

The main goal of the system I have been building is to allow for users, via a web interface, to remotely control embedded device clients that they own (the nature of the embedded device clients are not important). So there are 3 types of nodes:

1. **Embedded Device Client**
2. **User Client**
3. **Control Router**

The Control Router acts a broker for messages that get sent between User Clients and Embedded Device clients. In my initial approach, the Control Router is a registrar for RPC methods from the Embedded Device Client. User clients request control of a particular device, and their commands get executed on the proper RPC channel that corresponds to their device. The transport protocols between User Clients and the Control Router and the Embedded Device Clients and the Control Router were WebSockets and TCP, respectively.  

### The Problems
At a high level, this system needs to do a few things. It needs to keep track of:
	
- What embedded devices are "alive" i.e. turned on and reachable via the network 
- What users are trying to access what devices at the present time

I started to run into problems with socket connections not being closed properly. Specifically, WebSocket connections on the user client side. In my initial design, when a WebSocket browser client logged on, it would request an embedded device id to control, and once that device connected, it would be marked "in use" by that user. But if that user's connection died abruptly, there would never be a signal to the server that the user actually died, and the encoder would never get released from the control session, indefinitely locking it out from further control from any users (even the same one). There workarounds and fixes to problems like these, some of which I attempted, but in doing so I started thinking more carefully about what and where the fundamental issue with the system was, and not just a way to patch the system so it would (maybe) work.

### Information and Message Passing

Over the course of this project I have worked quite a bit at the raw TCP socket level. Perhaps not all of it was necessary, but I will say that it has given me good insight into the lowest level of most all practical web based protocols in use today. As I got into trouble with the WebSockets and the embedded clients, I realized that I had been writing code with some fundamentally misleading assumptions about so called "connection based protocols".

#### The Illusion of Connections

They call TCP a "connection-based" protocol. As far as I'm concerned, that's not really true, though. Yes, there is the 3-way handshake **beginning** of a TCP connection, and the 4-way handshake **end** of a TCP connection, but the thought that I had was,

_"What the hell does a connection mean in between the beginning and end?"_

I figured, well, it doesn't mean anything. A month or two ago I read through some of Leslie Lamport's original paper on the idea of logical clocks and time in distributed systems ([Time, Clocks, and the Ordering of Events in a Distributed System](http://research.microsoft.com/en-us/um/people/lamport/pubs/time-clocks.pdf)). There are many important concepts to take away from that paper, but for me, there was one that stuck out: 

***Any notion of "universal" time is meaningless until information is sent***

Or, as I say to myself when I want to feel markedly profound: *Time is an illusion*.

#### Information Passing

It sounds rather dramatic, but I have more and more come to understand why it really is the best way to explain how things (systems) behave and the constraints which they are bound to. Let's take the TCP connection example, and model the connection as two parties, Alice and Bob, who are able to send messages to one another. Let's say a message in this case is just a string of any length, literally written on a slip of paper. Alice and Bob are separated by some distance, just like on any traditional network, so there is an intrinsic latency in the act of sending a message. Of course, to start the "connection", we can use a similar scheme as TCP/IP. For example, Alice sends [msg]"Want to connect"[msg] to Bob, Bob returns [msg]"Willing to connect"[ms] and Alice returns [msg]"Let's connect!"[msg], and from that point on the connection is regarded as "open" by both parties. 

Here's where the crux of the problem comes in. At this point, the system is running on assumptions. Alice is *assuming* that Bob is still listening for messages from her, and Bob is likewise *assuming* the same with regards to Alice. Any operation that gets executed by either party has a totally possible chance to fail. Alice has no idea if Bob went off to grab lunch 10 seconds after they made their handshake. Bob doesn't know if Alice fell off a cliff 3 seconds after they made their handshake. This was one of my realizations. Of course, I know you have to be careful with TCP connections, and there are things you can assume and can't assume about what's going on on the other end, but thinking about it in these terms really settled it for me. At a fundamental level, it is wrong to assume that a connection really holds information about the true state of the system. It doesn't. All that a connection tell you is this: you know that the party at the opposite end was willing to talk to you 
$$T -T_{handshake}$$ time ago, 
(I am assuming no messages got passed yet). There is a big distinction here. There are two things you could say about the system:

* You are "connected" to the opposite party: an **ASSUMPTION** .
* The opposite party was available for communication $$$T-T_{handshake}$$$ time ago: a **TRUTH** 

It is better to build a system based on truths rather than assumptions.

## Solutions

Having realized all this, I now needed a way to fix my problems with socket connections being left opened, etc. The problem with these connections is that they hold an *assumptive* state that isn't strictly reflective of the system's true state. For example, let's say a browser client connects to the control server, requesting a control session with its embedded device. Maybe the user happily sends some commands for a minute or two and then their computer crashes abruptly, without ever getting a chance to properly close the open socket connection to the control server. How should the system handle this state? Well, there are a few options. 

###Timeouts

We could try setting a timeout. That is, once a user client, call him client A, connects, we give him a lease period for his session, and if he hasn't renewed the lease after his lease period is up, the session gets closed. A fair approach, but there are still problems. In the system described above, there might be multiple users that are authorized to control the same device. Let's say another user, client B, tries to log in and control the same device that the crashed user(client A) was controlling. Well, for $$$T_{expirelease}$$$ - $$$T_crash$$$ time, client B will be locked out from using the device, because it appears that the crashed user (A) is still engaged in his session. This second user has an inconsistent view of the system. It looks as if the original user A is still fully engaged in his control session, when the truth might be that his computer died minutes ago.

How to address this new problem? Well, one of the important parameters in the above situation is the length of the lease period. Let's say we set the lease period at 15 minutes. Now, let's say an initial user A logs into a control session, and his computer crashes 3 minutes later. Now, for a whole **12 minutes**, anyone else who looks at the system will be told that user A still has control of his device. This is intolerable. I think most people would agree that having a system that gives you an inconsistent view of itself for 12 minutes at a time is not a system that works properly. Now, to be fair, for some applications, maybe delays like this are tolerable, for whatever reason. I am, however, looking at this problem from a theoretical point of view, and so will not accept shortcuts that are specific to one application. 

Ok, so a 15 minute lease time doesn't work so well. And we can easily see how similar problems exist for any lease times on the order of minutes. So, maybe if we make the lease time very short we can resolve our issue. Let's start at 30 seconds. Well, we still, in the worst case,  can present an inconsistent view of the system for a little less than 30 seconds (if the first user crashes immediately after gaining his lease on control). Still not so great. Let's push it all the way down to 1 second. Ok, so now we can only have an inconsistent view of the system for a maximum of 1 second. However, there are *still* issues to consider here, and here are where things get interesting. 

### Informational Limits

Let's say we have 3 browser users, A, B, and C, who all have authorization to control Device # 1. User A logs on first, and gains control. For a few minutes his control session continues, with him renewing his 1 second lease continually by sending out some sort of keep alive message. Now, a few minutes later, user B logs on and tries to request control of Device #1. When the lease period was long, it was easy to see that user B would just be locked out from control because user A has been granted a lease already (15 minutes in length, for example). However, the lease period is now 1 second. So it is much more important in this example to specify at what specific time user B logs on and requests control. Let's say user B logs on 0.5 seconds after user A's most recent control lease has just been granted.
Let's assume that the user's request for control are queued, so that after another 0.5 seconds and it is time for user A to renew his lease, user B's request is still sitting on a request queue. Now, at this point, there a couple of ways the system can behave. Let's contrast them as the Lockout Policy and the Shared Control Policy.

#### Lockout Policy

In this case, when the lease period for a user had ended (1 second after their last lease was granted), the aribiter of control, the **Control Server**, gives first priority for the next lease to the user who is already holding the lease. So, in essence, one user can hold control of a device indefinitely, without ever ceding control to any other user. Depending on the system and the application, this could perhaps be an acceptable mode of operation, but it doesn't seem entirely correct that a number of users who all have the **same** authorization level should be able to blocked out from the system indefinitely by one rogue user in the group. The Lockout policy works ok, with the one caveat pointed out above, and with the fact that the largest itnerval the system will present an inconsistent state of itself is at most equal to the defined lease time. The alternative policy, arguably, works more properly, and leads to more interesting insights.

#### Shared Control Policy

Let's say that the lease time is still 1 second, but when a new lease is to be granted, the system gives first priority to the *newest* user on the request queue. So if user B logged on 0.5 seconds after user A was just granted a lease, after another 0.5 seconds, he would be given the control lease for the following second. So with this setup, control could be getting passed off from user to user as fast as the defined lease time will allow. If the lease time is 100 milliseconds, control could be shifting from user to user every 100 milliseconds. At first appearance, this might seem like a rather awkward approach. One user is trying to control the device, but then control is immediately taken away from him 1 second later. This would seem to be jarring from a user experience point of view. However, it's actually not that bad at all. Let's assume that any time a device gets a control command and processes it, it will update every user of what change was just made. So every user always has a consistent view of the current state of their device. If this is true, then handing off control every second, or 100ms, turns out to not be so bad. Users will each try to issue their own commands, the commands will be processed synchronously at the device, and every user will always maintain a current view of the device's state. And if the lease time is made small enough, we never have to worry about crashed client connections screwing with the system. 

But as the lease time gets shorter, it becomes less meaningful for the browser clients. Let's think about it. If we make the lease time 25 milliseconds, this means that user "control" can get passed off as fast as every 25 milliseconds. From a human's persepctive, things changing every 25 milliseconds is pretty much indistinguishable from them changing instantaneously. So it appears as if every user in their authorization group has the ability to update the status of their device in nearly "real time", even if technically "real time" just means updates occurring every 25 milliseconds.

Wait a minute though, this Shared Control Policy has turned into a shared queue, where the queue holds commands from each user sequentially as they come in. However, this queue has one special property, which is that any addition to the queue has a built in latency i.e. the lease time. If this is the case, is the concept of a lease even necessary anymore? Could we just get rid of a lease granting policy altogether? Instead, what if we did the following. Eliminate the idea of leases entirely, and whenever a user wants to issue a command to his device, he sends the command. The server processes the command, sends the response, and that's it, the interaction is finished. Purely stateless. We can see how this is almost exactly like setting the lease time infinitesimally small i.e. to zero. We can think of this new method as a RESTful protocol. Clients send requests(could be HTTP) to the control server, and the server sends a response, and that's it. And the commands from each user will simply get queued up as they come in. We can now have multiple users controlling a single device in what feels like real time, without having to deal with maintaining state about the connection to any user. Now, technically, setting the lease time to zero isn't exactly the same as going to a stateless protocol, because we won't have the advantage of truly knowing whether or not a user is still alive or not, but for this scenario we don't really care. If a user's computer crashes or they become unable to send commands for whatever reason, the control server doesn't care, it just won't receive any messages from that user and therefore won't process them. These browser users are kind of non critical actors in the system in that respect. 

The most important things I learned in designing this system have to do with two things: time and information. It boils down to the fact that I stated above, in reference to Lamport's paper. The reality is, you can never *truly* know the state of a system as long as information is not being sent to you about the system. In other words, if user A and client B can only know about the opposite party at the last moment information was sent from them. So if a message from client B was sent to user A 30 seconds ago, user A can only really reason about what the state of client B was **30 seconds ago**, not his current state.







