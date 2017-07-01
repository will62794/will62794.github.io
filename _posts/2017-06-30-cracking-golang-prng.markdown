---
layout: post
title:  Cracking Golang's PRNG For Fun and (Virtual) Profit
date:   2017-06-30 12:00:00
categories: jekyll update
---

# Motivation

Recently, a friend of mine set up an application that was a kind of mini social network. It provided users with a virtual currency that they could send and receive from each other. Every user starts with a fixed number of virtual tokens, and the only way to gain or lose tokens is by giving or receiving tokens from someone else. There was another feature, however, for the more reckless users. It allowed for a very simple form of gambling, as a way for a user to win (or lose) tokens. You can wager some amount of tokens X, bet on the outcome of a virtual coin toss, and if you win, you gain X tokens, if you lose, you lose X tokens. The gambling feature intrigued me, and I wanted to see if there might be a way to game the system. Not long ago, I had listened to a story about some Russian hackers who were able to crack a particular model of casino slot machines by exploiting their weak internal random number generators, and I was curious if something similar would be possible here. The app's source code, written in Go, was publicly  available, which allowed me to see the internals of the web API etc. What intrigued and encouraged me was the fact that the gambling logic utilized Go's `math/rand` package for the generation of virtual coin toss outcomes (`crypto/rand` is Go's cryptographically secure PRNG). Using the default PRNG for secure applications is obviously bad practice to say the least, but I was curious to see what it would take to "crack" Go's default PRNG and beat the app's gambling system.

# Exploring PRNGs

Most every programming language has a built in way to generate "random" numbers. For most applications the precise meaning of "random" isn't that important. Roughly, a random number generator should be able to produce an apparently arbitrary sequence of numbers, ideally suitable for things like simulations, randomized testing, etc. For what seems like a relatively straightforward task on the surface, however, there is a significant amount of research that has gone into developing ways to generate streams of these "pseudo" random numbers with the right statistical properties. Some of the oldest and simplest PRNG algorithms are called **Linear Congruential Generators** (LCG). These operate by computing a simple modular addition to generate the next number in a random sequence. 

Slot Machine Hack: [https://www.wired.com/2017/02/russians-engineer-brilliant-slot-machine-cheat-casinos-no-fix/]







