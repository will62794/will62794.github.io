---
layout: post
title:  Cracking Golang's PRNG For Fun and (Virtual) Profit
date:   2017-06-30 12:00:00
categories: jekyll update
---

# Motivation

{% highlight python linenos %}


{% endhighlight %}

Recently, a friend of mine set up an application that was a kind of mini, virtual payment network. It provided users with a virtual currency that they could send and receive from each other. Every user starts with a fixed number of virtual tokens, and the only way to gain or lose tokens is by giving or receiving tokens from someone else. There was another feature, however, for the more reckless users. It allowed for a very simple form of gambling, as a way for a user to win (or lose) tokens. You can wager some amount of tokens X, bet on the outcome of a virtual coin toss, and if you win, you gain X tokens, if you lose, you lose X tokens. The gambling feature intrigued me, and I wanted to see if there might be a way to game the system. Not long ago, I had listened to a story about some Russian hackers who were able to crack a particular model of casino slot machines by exploiting their weak internal random number generators, and I was curious if something similar would be possible here. The app's source code, written in Go, was publicly  available, which allowed me to see the internals of the web API etc. What intrigued and encouraged me was the fact that the gambling logic utilized Go's `math/rand` package for the generation of virtual coin toss outcomes (`crypto/rand` is Go's cryptographically secure PRNG). The default PRNG shouldn't be used for security sensitive applications, but I was curious to see what it would take to "crack" Go's default PRNG and beat the app's gambling system.

<!-- 
# Pseudo Random Number Generators: An Investigation

Most every programming language has a built in way to generate "random" numbers. For most applications the precise meaning of "random" isn't that important. Roughly, a random number generator should be able to produce an apparently arbitrary sequence of numbers, ideally suitable for things like simulations, randomized testing, etc. For what seems like a relatively straightforward task on the surface, however, there is a significant amount of research that has gone into developing ways to generate streams of these "pseudo" random numbers with the right statistical properties. Some of the oldest and simplest PRNG algorithms are called **Linear Congruential Generators** (LCG). These operate by computing a simple modular addition to generate the next number in a random sequence. They can be described with the following equation:

$$
\begin{align*}
x_{n+1} = ax_{n} + c \mod{m}
\end{align*}
$$



Some of the other popular algorithms include the Mersenne Twister, and the Linear Feedback Shift Register. Some of these vary in their level of security. -->

# Go's Additive Lagged Fibonacci Generator

The random number generation algorithm used in [`math/rand/rng.go`](https://golang.org/src/math/rand/rng.go) is not very well documented. There is a comment in the file referencing two authors, "DP Mitchell and JA Reeds", but there isn't much beyond that. Searching around a bit, I was able to find a few internet threads with mentions of the algorithm used in `math/rand`, but I couldn't find any official mention anywhere within the Go documentation. There were a few references to it as being an *Additive Lagged Fibonacci Generator*, which seemed [relatively well known](https://en.wikipedia.org/wiki/Lagged_Fibonacci_generator) as a method for random number generation. The ALFG's method for computing random numbers is very simple to describe. It's called a "Fibonacci" generator because it produces a number sequence in a similar way to the Fibonacci sequence. The n'th number of the sequence is a sum of two previous elements of the sequence:



$$
\begin{align*}
x_{n} = x_{n-j} + x_{n-k}
\end{align*}
$$

where $$j$$ and $$k$$ are fixed parameters of the algorithm. This is the core implementation of the ALFG algorithm in Go:

{% highlight go linenos %}
// Uint64 returns a non-negative pseudo-random 64-bit integer as an uint64.
  func (rng *rngSource) Uint64() uint64 {
  	rng.tap--
  	if rng.tap < 0 {
  		rng.tap += _LEN
  	}
  
  	rng.feed--
  	if rng.feed < 0 {
  		rng.feed += _LEN
  	}
  
  	x := rng.vec[rng.feed] + rng.vec[rng.tap]
  	rng.vec[rng.feed] = x
  	return uint64(x)
  }
{% endhighlight %}

[Good Article](https://appliedgo.net/random/)

# Predicting PRNG Sequences

To consider a random number generator "broken", there must be some efficient way to predict it's next output. We can consider this as obtaining an "oracle" on the RNG. Being able to do this would obviously provide a way to easily beat the gambling system. If you could predict every next output, you could win every gamble with full certainty. There were a few approaches I fiddled with in order to find such an "oracle". I had recently played around with [Microsoft's Z3 Theorem Prover](https://github.com/Z3Prover/z3). It is great at solving constraint systems efficiently for many types of systems (strings, bitvectors, real numbers, etc.). I figured I could try to encode Go's number generation algorithm within Z3 and see if it could solve for the next output, given some history of previous outputs. My hope was that the combined knowledge of a long sequence of output values and the precise algorithm would constrain the system enough to allow Z3 to find a unique next output. The main problem with this approach was that I was uncertain if it would actually work. I might up end investing a lot of time into encoding the algorithm properly in Z3 and debugging it, only to find out that its solver wasn't actually able to compute what I wanted in a reasonable amount of time. It may still be a valid approach, but I haven't explored it further. As far as my research indicated, the ALFG algorithm is considered as a very good random number generator, and I didn't find any easy, known exploits that took advantage of a particular weakness of the algorithm. While poking around the source code in `math/rand/rng.go`, however, I noticed a particular detail that led me down a more promising path.


# Seed Subtleties

The interface to the Go random number generator is provided in `math/rand/rand.go`. A random number generator "source" is an instance of a random number generator that holds its own internal state. Different RNG sources can be advanced independently of each other without affecting the internal state of a different source. To seed a source, Go provides the following function

{% highlight go linenos %}
// Seed uses the provided seed value to initialize the generator to a deterministic state.
// Seed should not be called concurrently with any other Rand method.
func (r *Rand) Seed(seed int64)
{% endhighlight %}

which takes a 64-bit integer as its argument. Random number generator seeds are a way to initialize the state of the generator to some known state, so that two generators initialized with the same seeds produce the same number sequences. Internally, the `rand.Seed` function ends up calling another `Seed` function, in `math/rand/rng.go`:

{% highlight go linenos %}
// Seed uses the provided seed value to initialize the generator to a deterministic state.
  func (rng *rngSource) Seed(seed int64) {
  	rng.tap = 0
  	rng.feed = _LEN - _TAP
  
  	seed = seed % _M
  	if seed < 0 {
  		seed += _M
  	}
  	if seed == 0 {
  		seed = 89482311
  	}
  
  	x := int32(seed)
  	for i := -20; i < _LEN; i++ {
  		x = seedrand(x)
  		if i >= 0 {
  			var u int64
  			u = int64(x) << 40
  			x = seedrand(x)
  			u ^= int64(x) << 20
  			x = seedrand(x)
  			u ^= int64(x)
  			u ^= rng_cooked[i]
  			rng.vec[i] = u
  		}
  	}
  }
{% endhighlight %}

There's some initialization logic and seeding arithmetic going on here, but there was one intriguing part. The underscored variables that appear in this function are constants defined at the top of the file:

{% highlight go linenos %}
const (
  	_LEN  = 607
  	_TAP  = 273
  	_MAX  = 1 << 63
  	_MASK = _MAX - 1
  	_A    = 48271
  	_M    = (1 << 31) - 1
  	_Q    = 44488
  	_R    = 3399
  )
{% endhighlight %}


and it was the value of `_M` that interested me. The line 

{% highlight go linenos %}
seed = seed % _M
{% endhighlight %}

takes the given seed argument modulo `_M`, defined as `(1 << 31) - 1` (equivalent to $$ 2^{31} - 1 $$). So, this means that, even though the seed argument is given as a 64-bit integer, only 31 bits of it are actually used. In other words, there are only $$ 2^{31} - 1 $$ unique seed values, since the seed argument undergoes the modulo operation before being used in any of the actual seeding logic. After looking back at the Go language docs, I realized that this is, in fact, mentioned in the official documentation, but I think it is easy to miss, especially if you just use the Seed function by looking at its function signature. The official Go documentation for `math/rand.Seed` reads:


"Seed uses the provided seed value to initialize the default Source to a deterministic state. If Seed is not called, the generator behaves as if seeded by Seed(1). **Seed values that have the same remainder when divided by 2^31-1 generate the same pseudo-random sequence.** Seed, unlike the Rand.Seed method, is safe for concurrent use."

After this discovery, I switched to a new approach to cracking the random number generator.. If there were $$2^{64}$$ possible seeds, it would be infeasible to try, by brute force, try to figure out the original seed. However, with only $$2^{31}$$ seed possibilities, brute forcing a seed seemed within reach.


# Finding the Seed

If I could figure out the initial seed, I would then have a way to produce the entire future sequence of gambles, giving me a perfect way to win every time. The app server seeded the random number generator once at startup, and generated random numbers for gambles based on that initial seed, until the server process was restarted. By scraping the app's public API, I was able to compile a list of all gambles that ever occurred. Each gamble was saved with the outcome of the coin toss for that gamble (heads or tails) and an associated timestamp i.e. the time at which the gamble occurred. 

I started by considering prefixes of random number sequences, as a way to "fingerprint" generated sequences. Since gamble coin toss outcomes were binary, the sequences consisted only of 0's and 1's. I figured that, if there are only $$2^{31}-1$$ possible seeds, then there are no more than $$2^{31}-1$$ unique random number sequences, since each seed produces exactly one unique sequence. Call this set of all possible random number sequences $$ S $$, with $$  \|S\| = 2^{31}-1 $$. Each sequence, $$ s \in S $$ can be viewed as an infinite sequence, but, in practice, you don't really need to see the whole sequence in order to establish its "uniqueness".

<!-- Random Number Sequence Prefix Diagram -->
<svg height="100" width="800">
  <text x="10" y="20" style="font-size:18px;font-family:monospace;">
    <tspan y="25"> RNG Sequence: </tspan>
    <tspan x="10" y="50">
    	<tspan style="fill:#C70039;">01101010111100001010111101</tspan>01010011001110101010110001110110111...
    </tspan>
    </tspan>
    <tspan x="85" y="80" style="fill:#C70039;">Sequence Prefix</tspan>
  </text>
</svg>

Since there are only 2^31 sequences, I figured that each sequence would, most likely, have a unique 31-bit prefix. Even if there were prefix collisions between sequences, the sequences could easily be disambiguated by just looking at a longer prefix. With this in mind, I decided to create a lookup table that mapped sequence prefixes of length 31 to the seeds that produced the sequence. Basically, every seed can be considered a unique "id" for the sequence that it generates i.e. we can name every sequence by its seed. 


| **Sequence Prefix**   	| **Seed**			|
| :------------------------:| :----------------:|
| `0011110110110110`  		| 1287343389 		|
| `0110110111001101`  		| 9347019211    	|
| `1011110010111100` 		| 22277781193   	|
| ... 						| ...   			|

With $$2^{31}$$ 64-bit seeds (which would be stored as 32-bits), and prefixes of 31 bits, I estimated the whole table could, ideally, be stored in a reasonable amount of space: 

$$  2^{31} * 8  \; \text{bytes} * 4 \; \text{bytes} = 34359738368 \; \text{bytes} \approx 32 \; \text{GB} $$

I generated the lookup table using a Go script that inserted the key value pairs as documents in a MongoDB database. It took around an hour to generate. For computing this, I was using a Ubuntu Linux desktop machine with 12 Intel i7-4930K CPU (3.40GHz) processor cores, which provided some excellent computing horsepower. 

Once the table was created, I could easily scan through the full list of gambles looking for subsequences of length 31 that mapped to valid seeds. If a subsequence mapped to a valid seed, then I would check to see if the seed produced the correct sequence beyond the first 31 elements to verify it. Unfortunately, this didn't produce the results I was hoping for. I couldn't find seeds that actually produced observed subsequences that extended beyond 31 elements. My working assumption was that, within the full sequence of gambles, there may have been some server restarts, so there would be points where the RNG was re-seeded, but that was fine, since I could find the re-seed points by looking through all subsequences and trying to find valid sequence prefixes.
 
<!-- Random Number Reseeding Diagram -->
<svg height="100" width="800" style="background:none;">
  <text x="10" y="20" style="font-size:16px;font-family:monospace;">
  	<tspan y="25">Full Observed RNG Sequence:</tspan>
    <tspan x="10" y="55">
    	01101011000010101101<tspan style="fill:#C70039;">[1]</tspan>011010110101111010011100101<tspan style="fill:#C70039;">[0]</tspan>000000111011<tspan style="fill:#C70039;">[1]</tspan>00011...
    </tspan>
    <tspan x="285" y="90" style="fill:#C70039;font-size:18px;">[Reseeds]</tspan>
  </text>
</svg>

When I couldn't produce satisfactory results with this approach, I went back to the drawing board and tried to verify that all of my assumptions about how the number sequences were getting generated were actually correct.

# Random Interference

The source code for the app was available, so I was able to download it and run it locally. I wanted to check my assumption that every gamble that gets executed corresponds to exactly 1 generation of the random number generator. This was the basic assumption I was going off of for the lookup table approach i.e. that I was observing contiguous sequences of gamble results and therefore contiguous outputs of the random number generator. When running the app on my Macbook and simulating some gambles, I was able to verify that each gamble jumped the global PRNG forward exactly 1 generation. Even after running the app for a while and exercising various other behaviors, this would hold true. Since this didn't seem to match what I observed against the real app, I tried to make sure I was replicating the exact environment the app server was running in. 

When deployed, the app ran in a Linux Docker container, so I tested the app locally inside the same Docker container configuration. Surprisingly, this setup produced some noticeably different behavior regarding the way the app generated random numbers. By executing gambles continuously, at a fixed rate, I was able to observe the current generation of the random number generator. So, for every simulated gamble, I would observe and make sure that the PRNG skipped a single generation. This was not the case, however. It seemed that, at a roughly fixed interval, about every 30 seconds or so, the PRNG would skip forward, on average, around 12-13 generations. Since the app uses Go's global random number generator, any other code that makes a call to it would affect the state of the generator source. There really weren;t that many Go packages that the gambling code utilized, beyond standard library packages. After searching the Go codebase a bit, however, I did find a couple noticeable places that *do* make calls to the global random number generator. One which seemed significant was in the Go DNS resolution logic. The following, condensed code snippet is a function inside the `net/dnsclient_unix.go`:

{% highlight go linenos %}
// exchange sends a query on the connection and hopes for a response.
  func exchange(ctx context.Context, server, name string, qtype uint16, timeout time.Duration) (*dnsMsg, error) {
  	...
  	...
  	...
  	for _, network := range []string{"udp", "tcp"} {
  		// TODO(mdempsky): Refactor so defers from UDP-based
  		// exchanges happen before TCP-based exchange.
  
  		ctx, cancel := context.WithDeadline(ctx, time.Now().Add(timeout))
  		defer cancel()
  
  		c, err := d.dialDNS(ctx, network, server)
  		if err != nil {
  			return nil, err
  		}
  		defer c.Close()
  		if d, ok := ctx.Deadline(); ok && !d.IsZero() {
  			c.SetDeadline(d)
  		}
  		out.id = uint16(rand.Int()) ^ uint16(time.Now().UnixNano())
  		in, err := c.dnsRoundTrip(&out)
  		if err != nil {
  			return nil, mapErr(err)
  		}
  		if in.truncated { // see RFC 5966
  			continue
  		}
  		return in, nil
  	}
  	return nil, errors.New("no answer from DNS server")
  }
{% endhighlight %}

There is a call to the global `rand` function that is used to generate a random DNS packet id. This was promising, since it seemed like DNS resolution could potentially be a pretty hot section of code for anything that makes any kind of network requests. If this was portion of code was in fact being executed by the app server, though, there were still two things to figure out: 

1. What explained the generation skips occurring every 30 seconds?
2. Why were these skips observed only when run on the Docker container, but not when testing locally on my Mac?

### Culprit 1: DNS Resolution

My hypothesis was that this DNS resolution code was what was injecting extra skips into the global PRNG, but I wanted to come up with a test that would validate this. It turns out that this test also served as a way to see why the behavior was different between the Linux Docker container and my Mac. I started with this simple Go script:

{% highlight go linenos %}
package main

import "fmt"
import "net/http"
import "math/rand"

func main() {
	var seed int64 = 42

	// Seed.
	rand.Seed(seed)
	fmt.Printf("Seeded 'rand' with %d\n", seed)

	for i := 0; i < 6; i++ {
		fmt.Printf("Generation %d: %d\n", i, rand.Int())
	}

	fmt.Println("-----")

	// Re-seed.
	rand.Seed(seed)
	fmt.Printf("Seeded 'rand' with %d\n", seed)

	fmt.Printf("Pre  HTTP request: %d\n", rand.Int())
	http.Get("http://google.com")
	fmt.Printf("Post HTTP request: %d\n", rand.Int())
}
{% endhighlight %}

It seeds `math/rand` with a fixed seed, generates a few numbers, re-seeds with the same seed, generates a single number, makes an HTTP request, and then generates a second number. The first loop is used as a reference to see what the first few generations of the *Seed 42* sequence are without any interference. In the Go documentation on DNS resolution, there is a note about the existence of two different DNS resolvers. You can optionally use a native C library DNS resolver, or a pure Go resolver, and this can be configured via the `GODEBUG` environment variable. This is the terminal output of the above script when run with the two different DNS resolvers:

```
➜  golang_rng GODEBUG=netdns=cgo go run test_http.go
Seeded 'rand' with 42
Generation 0: 3440579354231278675
Generation 1: 608747136543856411
Generation 2: 5571782338101878760
Generation 3: 1926012586526624009
Generation 4: 404153945743547657
Generation 5: 3534334367214237261
-----
Seeded 'rand' with 42
Pre  HTTP request: 3440579354231278675
Post HTTP request: 608747136543856411

➜  golang_rng GODEBUG=netdns=go go run test_http.go
Seeded 'rand' with 42
Generation 0: 3440579354231278675
Generation 1: 608747136543856411
Generation 2: 5571782338101878760
Generation 3: 1926012586526624009
Generation 4: 404153945743547657
Generation 5: 3534334367214237261
-----
Seeded 'rand' with 42
Pre  HTTP request: 3440579354231278675
Post HTTP request: 3534334367214237261
```

You can see that, when using the `cgo` DNS resolver, the HTTP request doesn't affect the random number generator, but when using the `go` resolver, the HTTP request skips the random number generator forward by 4 generations! This seemed like a very clear sign that the DNS resolver was the likely culprit for PRNG interference. The Go documentation for the `net` package backed up this hypothesis:

```
The method for resolving domain names...varies by operating system.

On Unix systems, the resolver has two options for resolving names.
It can use a pure Go resolver that sends DNS requests directly to the servers
listed in /etc/resolv.conf, or it can use a cgo-based resolver that calls C
library routines such as getaddrinfo and getnameinfo.

By default the pure Go resolver is used ... the cgo-based resolver is used instead 
under a variety of conditions: on systems that do not let programs make direct DNS 
requests (OS X),...
```
 
### Culprit 2: The mgo MongoDB Database Driver

After determining that DNS resolution was the most likely cause for PRNG generation skips, I wanted to figure out why they were happening at regular intervals. If the app is dormant i.e. no users are active, it seemed like there could be very few possible components that would be making network requests and therefore causing DNS lookups. One candidate, however, was the database driver. In order to persist various types of application data, the server, on startup, creates a connection to a MongoDB replica set, by means of the [mgo](https://labix.org/mgo) driver. I wanted to see if the driver could potentially be executing requests on some background thread, even while there was no explicit user activity. I tried to monitor the network traffic while the app was running locally, and I persued the mgo source code a bit keeping in mind the 30 second interval time. This bit of logic, in `mgo/cluster.go` seemed like a good candidate:

{% highlight go linenos %}
// How long to wait for a checkup of the cluster topology if nothing
// else kicks a synchronization before that.
const syncServersDelay = 30 * time.Second
const syncShortDelay = 500 * time.Millisecond

// syncServersLoop loops while the cluster is alive to keep its idea of
// the server topology up-to-date. It must be called just once from
// newCluster.  The loop iterates once syncServersDelay has passed, or
// if somebody injects a value into the cluster.sync channel to force a
// synchronization.  A loop iteration will contact all servers in
// parallel, ask them about known peers and their own role within the
// cluster, and then attempt to do the same with all the peers
// retrieved.
func (cluster *mongoCluster) syncServersLoop() {
	...
	...
	...
}
{% endhighlight %}

This status checking logic runs once every 30 seconds! This fit with the interval of generation skips, and also with the number of skips I was seeing, which was around 12 on average. I had seen an HTTP request skip the random number generator forward 4 iterations, and if the mgo driver was connecting to a 3-node replica set for a status check, that would fit witho 4 generations * 3 connections = 12 generations per status check. I also verified this behavior by observing the app's network traffic. It was clear that it would try to make connectins to MongoDB cluster members periodically. So, with this affirmed, I updated my understanding of the observed gambling outcomes.

# Bringing it Together

I now had a complete understanding of how the random number sequences I observed were generated and how they were affected by the internal app logic. My model of this can be illustrated as follows:

<!-- Random Number Sequence with Skips Diagram -->
<svg height="80" width="800" style="background:none;">
  <text x="10" y="20" style="font-size:14px;font-family:monospace;">
  	<!-- True -->
  	<tspan x="0" y="25">True:</tspan>
    <tspan x="100" y="25">
    	...01011000010101101<tspan style="fill:#FF4500;">101001101101</tspan>011010110101111010011100<tspan style="fill:#FF4500;">000001001111</tspan>000000111...
    </tspan>
    <!-- Observed -->
  	<tspan x="0" y="55">Observed:</tspan>
    <tspan x="100" y="55">
    	...01011000010101101<tspan style="fill:gray;">____________</tspan>011010110101111010011100<tspan style="fill:gray;">____________</tspan>000000111...
    </tspan>
  </text>
</svg>

I could observe partial runs of contiguous generations, but there would be skips interspersed, and I had to take that into account when trying to predict future outputs. To crack the seed, I took a slightly different approach than my original lookup table. Instead of looking for prefixes of generated sequences in the observed sequence, I decided instead to look for subsequences that appeared anywhere. 

#### Seed Search Approach

First, let's establish some notation to make things easier.

- $$R_{seed}$$ : the random sequence generated by seeding the generator with the value $$seed$$. This is an infinite sequence.
- $$S[i_0:i_1]$$ : the subsequence of a sequence $$S$$ that starts at index $$i_0$$ and ends at index $$i_1$$.
- $$Subseq(P, Q)$$ : $$P$$ is a subsequence of $$Q$$, where $$P$$ is a finite sequence.
- $$Len(S)$$ : the length of a finite sequence $$S$$.


We want to establish the fact that observing a particular subsequence of a random sequence is a practical way to identify it uniquely. The meaning of that will become clearer in the following section. Let's consider a set of 2 different finite random sequences:

$$ S_a = R_{seed_a}[:N] $$ 

$$ S_b = R_{seed_b}[:N] $$

and a sequence $$V$$, with $$Len(V)=M$$, $$Subseq(V, S_a)$$, and $$M << N$$. Now, let $$F$$ be the event $$Subseq(V, S_b)$$. We can call it an event if we consider the above sequences as ranging over a set of parameters with uniform probability. We want to compute the following conditional probability:

$$ P( seed_a=seed_b | F) $$

In other words, we want to find the probability that our two sequences $$S_a$$ and $$S_b$$ have the same seed if we observe $$V$$ in $$S_b$$  (Remember that we established $$Subseq(V, S_a)$$ as a fixed assumption). We can apply Bayes' Rule to compute the above expression. For two events $$A, B$$ Bayes' rule is defined as follows:

$$ P(A\mid B) = \dfrac{P(A)P(B\mid A)}{P(B)} $$

So, applying this:

$$ 
\begin{align*}
P( seed_a=seed_b \mid F) = \dfrac{ P(F \mid seed_a=seed_b) P(seed_a=seed_b) }{ P(F) }
\end{align*}
$$

Let's see if we can figure out the values for each of these sub-expressions:

+ $$ P(seed_a=seed_b) $$: If we think about $$seed_a $$ and $$ seed_b $$ as ranging over all possible unique seed values, then each one can be exactly one of $$2^{31}-1$$ values. Therefore, the probability that they are equal is simply $$\dfrac{1}{2^{31}-1}$$ (Fix one, and see what the probability of choosing the other one equal to it is).

+ $$ P(F \mid seed_a=seed_b) $$: If $$ seed_a=seed_b $$ this means that $$ S_a $$ and $$S_b$$ are identical sequences. So, if $$ S_a = S_b $$, what is the probability of $$F$$ i.e. that $$V$$ is a subsequence of $$S_b$$? Since we know that $$Subseq(V, S_a)$$, and $$S_a=S_b$$, then $$V$$ must be a subsequence of $$V_b$$. Thus, this conditional probability is equal to 1.

+ $$ P(F) $$: This is is equal to the probability that $$V$$ is a subsequence of $$S_b$$. If $$V$$ ranges over all possible sequences of length $$N$$ then there are $$2^N$$ possible choices for $$V$$. Now, within a particular $$S_b$$, how many different subsequences are actually seen? Well, if we think about sliding a fixed window of length $$N$$ from left to right across the whole sequence $$S_b$$ we can see that there are $$M-N$$ possible unique subsequences that appear in one particular $$S_b$$. So, there are $$2^M$$ choices for $$S_b$$, and each choice contains a set of at most $$M-N$$ unique subsequences. In order for $$F$$ to occur, we would have to choose a $$V$$ that was in the set of subseqences of $$S_b$$, of which there are only $$M-N$$. So, if we choose uniformly at random from the entire space of $$V$$, we have a probability of

$$ \dfrac{M-N}{2^N} $$

that we choose one that is actually a subsequence of $$S_b$$. If we plug back in to our original expression:

$$ 
\begin{align*}
P( seed_a=seed_b \mid F) = \dfrac{1}{2^{31}} \times \dfrac{2^N}{M-N}
\end{align*}
$$


This result tells us that if we encounter a specific subsequence of length N in an observed random number sequence, and we also observe that subsequence in a another random sequence, the two random sequences were generated with the same seed, with a very high probability.




Slot Machine Hack: [https://www.wired.com/2017/02/russians-engineer-brilliant-slot-machine-cheat-casinos-no-fix/]

# Building the Autogambler Bot

To figure out the seed, we can feed a large number of gambles into the system to ensure that we can observe contiguous output sequence i.e. there are no generation skips. If we are able to predict, roughly, when the server was last restarted, we can estimate how many generations have passed in total due to the periodic status checks. We can then write a Go program that generates random sequences of at least that length, and we can search for the observed subsequence in random sequences generated by each possible seed. If we find the subsequence in a random sequence, then we should have our seed.






