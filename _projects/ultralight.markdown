---
layout: project
title:  "UltraLight"
subtitle: "Tone Activated Light Switch"
year:   2013
categories: electronics software hardware design
thumbnail: "ultralightcover3.jpg"
---

![alt text](/assets/ultralightv1.jpg)


This project started after a prompt from a college friend, who wanted to eliminate the hassle of getting up to turn off the lights in her dorm room once she got into bed. The first thought was to get a "Clapper", that she could plug her lamp in to so she could clap to shut the lights off. This was a fine solution, but the Clapper is noted for its unreliability and sensitivity to stray sounds. So, I decided to build a new and improved sound-activated light switch. The first version of the UltraLight uses a small electret microphone and an Arduino Uno to control a Solid State Relay. The main challenge of the project was in the software. I wanted to make the light switch sensitive to a specific frequency. I originally had the thought to make the trigger tone ultrasonic, so that you could trigger the switch without making any sound, but after some experimentation I soon found that the microphone I was using wasn't sensitive enough and the Arduino wasn't quite powerful enough to process frequencies that high (~20kHz). I settled on a lower frequency range (although I do still think there is potential in the ultrasonic communication idea; a good article on the idea: <a href="http://rnd.azoft.com/mobile-app-transering-data-using-ultrasound/">Transferring Mobile Data Using Ultrasound</a>).

![alt text](/assets/ulightv1mic.jpg)



To detect the presence of a specific tone I used an implementation of the Goertzel algorithm, a simpler, more efficient sibling of the Fourier Transform, when you are interested in detecting a single frequency instead of an entire range.
The Goertzel Algorithm processed the audio signal coming out of the Electret Mic, but with some experimentation playing tones from my iPhone, I determined that I would need an additional layer of data encoding within the tone itself. There was too much interference from erroneous noises in the surrounding environment. Some of the most well-known and trusted ways to encode data for transmission is through some kind of modulation technique: amplitude or frequency modulation for example. I thought I could pick a carrier frequency in the 3-5 kHz range and then modulate the amplitude of that carrier signal at a rate in the 50-100Hz range. While the theory is sound, the implementation was, again, just a little bit out reach for the hardware I was using. To demodulate the incoming carrier signal and then run the Goertzel algorithm on the demodulated signal was too much work for the Arduino's Atmega328P, which runs at 16MHz (and the ADC is even slower than this). I used a simpler solution. Instead of going with the "analog" method of amplitude modulation, I created a specific train of digital pulses, say, ON-200ms, OFF-300ms, ON-500ms, and let the Arduino watch for a pulse train of that signature at the carrier frequency (around 3kHz). In the final form of the first version, I ended up just having about three 1-second pulses played one after the other. I found that this minimized nearly all interference from surrounding noises, even though it made for a slightly more annoying trigger tone.


I have been working on a second version that employs a custom printed circuit board, as well as dimming functionality, an enhanced trigger tone communication scheme, a much smaller form factor, and an iOS app.



![alt text](/assets/ulightv2.jpg)

![alt text](/assets/ulighteagle.jpg)
![alt text](/assets/ulightapp.jpg)

<iframe width="853" height="480" src="//www.youtube.com/embed/ahf3DxUIGtE" frameborder="0" allowfullscreen></iframe>


