---
layout: post
title:  "On Writing, Specification, and Outputs"
categories: formal-methods specification writing
---

In Andy Grove's [High Output Management](https://www.goodreads.com/book/show/324750.High_Output_Management), on his experiences from management at Intel, he makes a comment about the value of writing "reports" in a business or organizational setting:

<!-- pg. 48 -->

> But reports also have another totally different function. As they are formulated and written, the author is forced to be more precise than he might be verbally. Hence their value stems from the discipline and the thinking the writer is forced to impose upon himself as he identifies and deals with trouble spots in his presentation. Reports are more a **medium** of **self-discipline** than a way to communicate information. Writing the report is important; reading it often is not.

This comment felt nicely portable to a core type of value derived from the use of formal methods in an engineering and design context, somewhat analogous to Leslie Lamport's oft-cited quip on writing and mathematics:

> Writing is nature’s way of letting you know how sloppy your thinking is...Mathematics is nature’s way of letting you know how sloppy your writing is.

and one that has been [re-emphasized](https://www.youtube.com/watch?v=pnfrWPFWbAA) by those across industry e.g. [by folks](https://cacm.acm.org/practice/systems-correctness-practices-at-amazon-web-services/) recently at AWS:    

> First, the act of deeply thinking about and formally writing down distributed protocols forces a structured way of thinking that leads to deeper insights about the structure of protocols and the problem to be solved.

In the setting of Grove's book, as its title suggests, a core theme is about measuring *outputs* of your work, not merely *activity*. For programmers or other type of lower-level individual contributors, outputs may be significantly easier to measure quantitatively e.g. lines of code written, features shipped, bugs fixed, etc. For managers (or, more generally, a broader class of modern knowledge workers or researchers), these outputs may be less tangible and harder to measure concretely. A main idea of his framework is that, more generally, output can essentially be measured as the output of a team you manage and/or the output of the other people or teams in an organization that you influence. A related aspect of this framework is one of Grove's alternate definitions of "manager", which he calls a *know-how* manager:

<!-- page 40 -->
> If the manager is a knowledge specialist, a *know-how* manager, his potential for influencing neighboring organizations is enormous. The internal consultant who supplies needed insight to a group struggling with a problem will affect the work and the output of the entire group...Thus, the definition of a "manager" should be broadened: individual contributors, who gather and disseminate know-how and information should also be seen as middle managers, because they exert great power within the organization.

This *know-how manager* concept is perhaps somewhat natural to organizations where individual engineers can hold significant influence even if they have not formally assumed a "management" role. It also reinforces the broader space of possible outputs one might produce. That is, if disseminating know-how or transferring knowledge to others is one way to increase output of an organization, we may consider the writing process similarly. Deepening and expanding one's own understanding of a problem by writing (or specifying) is an activity that later acts to increase output of the organization when others may need to come to understand or extend that problem or system. If the activity of writing or specifying is a way to deepen the understanding or knowledge of a problem or domain, this should ultimately be valuable since it implies additional leverage in the future when this person serves as a core contributor of insights or knowledge on this domain that impacts many others in the organization.

Further applying this "output-oriented" framework to Grove's first statement above would imply that a detailed written report (e.g. or a formal specification, analogously) may not necessarily be a direct *output* (if no-one reads it, how could it be?). Rather, the valuable output associated with writing a report may be decoupled from the production of the written report itself, but instead with the way it impacts the eventual output of an individual, team, or organization. That is, the process of writing itself and the *understanding, clarity, and knowledge* gained in the process is more closely tied to output here, though less tangible and harder to measure concretely.

These notions also felt somewhat related and applicable to a [classic talk](https://youtu.be/vtIzMaLkCaM?feature=shared&t=1288) on academic writing from Larry McEnerney, where he notes:

> In the real world you're going to stop paying your readers to care about what's inside of your head...You think writing is communicating ideas to your readers. It is not...It's not conveying your ideas to your reader...It's changing their ideas.

So, in this setting (academic writing), we can consider a fundamental output as *changing of the reader's ideas*. This framing abstracts the process away from the concrete written document itself. That is, the output of an intellectual or academic is not papers, strictly, but to what degree they can change the behavior or ideas of others who consume their work. I think this also serves as a decent proxy for the concept of *impact*, especially in modern academic research, where a published tool, benchmark, dataset, blog post, talk/lecture, or tweet may have equal if not more impact (e.g. effect on others ideas/behaviors) than a traditional academic paper.


Overall, I found Grove's writing on this topic a helpful lens to think about the value of writing and particularly the use of formal methods and formal specification in an engineering context. Especially given that I have often been discouraged when discussions on this topic often search for justifications of value based on how well a specification can map to a running system implementation, or help test and validate that system implementation more effectively. Those are certainly valuable auxiliary goals, but I find it helpful to separate them from the other, core value in developing these kinds of specifications, which may often be quite abstract or difficult to measure, similar to writing a report that no-one ever reads. 

I also find the following a helpful thought exercise: if I wrote a detailed formal specification of a problem to the point of convincing myself of a detailed, rigorous problem statement and solution, and then threw away the specification entirely, would this still have been a valuable process for me and/or the broader organization? Similarly, I find it is often not always a useful framing to measure the success of a specification process in terms of effective long-term maintenance of that specification and its conformance with an underlying system implementation. That is, we wouldn't consider it a negative outcome of a design process if our written design document becomes out of sync with the system implementation and is not maintained in accordance over time. It is obvious and natural to expect this of design documents, so it should not be unexpected for specifications.