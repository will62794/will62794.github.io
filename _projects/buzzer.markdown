<!-- ---
layout: project
title:  "Digital Buzzer System"
subtitle: "12 player Quiz Bowl Machine"
year:   2011
tools: C, Microelectronics
categories: electronics design hardware C programming
thumbnail: "buzzercover5.jpg"
---
![alt text](/assets/buzzerfront.jpg)


This project was built for my high school Latin Club, who participated in Quiz Bowl events called "Certamen", and they wanted a buzzer unit like the ones used at the formal competitions that they could practice with. It allows for 3 teams to play at once, each team with 4 buzzer buttons. There is a Rabbit brand microcontroller that receives and processes all the signals. The signals are sent from each buzzer to the central console via Ethernet cables. The software is written mostly in C with a small amount of assembly language here and there, and implements a lockout system. That is, once the first team buzzes in, the other teams are locked out, until the moderator chooses to move to the next earliest team who buzzed in. The central console includes 2 digit 7-segment LED displays to show which player buzzed in and there is a reset button to clear all buzzes from the system. The Latin Club used it several times and still has it in their possession and uses it for club events. This was one of my first forays into micro controller programming and digital electronics. I had custom circuit boards printed in order to route all the incoming signals into the Rabbit Microcontroller.


![alt text](/assets/buzzer1.jpg)

![alt text](/assets/buzzerpcb2.jpg)






 -->