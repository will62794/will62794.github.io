---
layout: post
title:  "On Writing, Specification, and Outputs"
categories: formal-methods specification writing
---

In Andy Grove's [book](https://www.goodreads.com/book/show/324750.High_Output_Management) on his experiences from management at Intel, he makes a comment about the value of writing "reports" in a business or organizational setting:

<!-- pg. 48 -->

> But reports also have another totally different function. As they are formulated and written, the author is forced to be more precise than he might be verbally. Hence their value stems from the discipline and the thinking the writer is forced to impose upon himself as he identifies and deals with trouble spots in his presentation.Reports are more a **medium** of **self-discipline** than a way to communicate information. Writing the report is important; reading it often is not.

While the last sentence may be a bit exaggerated, this was an interesting sentiment as it felt naturally portable to the domain of formal methods and specification applied in an engineering context e.g., analogous to Leslie Lamport's oft-cited quip on writing and mathematics:

> Writing is nature’s way of letting you know how sloppy your thinking is...Mathematics is nature’s way of letting you know how sloppy your writing is.

and one that has been [re-emphasized](https://www.youtube.com/watch?v=pnfrWPFWbAA) by those across industry e.g. again most recently [by folks](https://cacm.acm.org/practice/systems-correctness-practices-at-amazon-web-services/) at AWS

> First, the act of deeply thinking about and formally writing down distributed protocols forces a structured way of thinking that leads to deeper insights about the structure of protocols and the problem to be solved.

In the setting of Grove's book, as the title suggests, a core theme is about measuring *outputs* of your work, not merely *activity*. For programmers or other type of lower-level individual contributor, outputs may be significantly easier to measure concretely e.g. lines of code written, features shipped, bugs fixed, etc. For managers (or, more generally, a broader class of modern knowledge workers), these outputs may be less tangible and harder to measure concretely. Applying this "output-oriented" framework to Grove's first statement above, though, he seems to be claiming that a detailed written report (e.g. or a formal specification, analogously) is not necessarily coupled strongly with the true *output* of the process of writing the report (if no-one reads it, how could it be a true output of value?). 

More precisely, the valuable output associated with writing a report is not necessarily coupled with the production of the report document itself, but with the way it impacts the eventual output of an individual, team, or organization. That is, the process of writing itself and the *understanding, clarity, and knowledge* gained in the process is one of the key outputs here, though less tangible and harder to measure concretely. I think the statement about not reading written documents is likely a bit extreme, especiall since others reading your written material may be one scalable way to influence an organization's output, but there is some validity in the point. Similarly, writing a design document is arguably just an *activity*, but usually a necessary one in order to produce the *output*, being the successful development of a complex software system or feature.

I think this also related to another one of his alternate definitions of "manager", which he calls a *know-how* manager:

<!-- page 40 -->
> If the manager is a knowledge specialist, a *know-how* manager, his potential for influencing neighboring organizations is enormous. The internal consultant who supplies needed insight to a group struggling with a problem will affect the work and the output of the entire group...Thus, the definition of a "manager" should be broadened: individual contributors, who gather and disseminate know-how and information should also be seen as middle managers, because they exert great power within the organization.

This concept is perhaps somewhat natural to organizations where individual engineers can hold significant influence even if they have not formally assumed a "management" role. But it also emphasizes the broader space of possible outputs one might produce e.g. if disseminating know-how or transferring knowledge to others is one way to increase output of an organization, we can see the writing process similarly e.g. deepening and expanding one's own understanding of a problem by writing (or specifying) is a an activity that later acts to increase output of the organization when others may need to come to understand or extend that problem or system.

There is perhaps also some useful connection to the [classic talk](https://youtu.be/vtIzMaLkCaM?feature=shared&t=1288) on academic writing from Larry McEnerney, where he asserts:

> In the real world you're going to stop paying your readers to care about what's inside of your head...You think writing is communicating ideas to your readers. It is not...It's not conveying your ideas to your reader...It's changing their ideas.

So, in this setting of academic writing, we can alternatively consider this type of writing (e.g. an academic paper or manuscript) as having *changing of the reader's ideas* as a fundamental output. This may not be the only output, but it is a framing that abstracts the process away from the concrete written document itself. That is, the output of an intellectual or academic is not papers, strictly, but to what degree they can change the behavior or ideas of others who consume their work. I think this also serves as a decent proxy for the concept of *impact* in academic research.


Overall, I found Grove's writing on this topic a refreshing lens to think about the value of writing and formal specification in an engineering context. Especially given that I have often been dismayed when discussions about this topic often search for justifications of value based on how a specification can map to a running system implementation, or help test and validate that system more effectively. These are valuable additinal goals, but I find it helpful to separate them from one, core value of developing these kinds of specifications. Even if no-one ever reads them! In more concrete terms, I find the following a helpful thought exercise: if I wrote a detailed formal specification of a problem to the point of convincing myself of the solution, with edge cases and all, and then deleted the specification entirely, would this still have been a valuable process for me and/or the broader organization?

Similarly, I find it is often not always a useful framing to measure the success of a specification process in terms of effective long-term maintenance of that specification and its conformance with the underlying system imeplementatino. That is, we wouldn't consider it a negative outcome of a design process if the design oducment becomes out of sync with the system implementation and is not maintained in accordance. It is obvious and natural to expect this of design documents. 