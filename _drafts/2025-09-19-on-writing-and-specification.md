---
layout: post
title:  "On Writing, Specification, and Outputs"
categories: formal-methods specification writing
---

In Andy Grove's [book](https://www.goodreads.com/book/show/324750.High_Output_Management) on experiences of management at Intel, he makes a comment about the value of writing "reports" in a business or organizational setting:

<!-- pg. 48 -->

> But reports also have another totally different function. As they are formulated and written, the author is forced to be more precise than he might be verbally. Hence their value stems from the discipline and the thinking the writer is forced to impose upon himself as he identifies and deals with trouble spots in his presentation.Reports are more a **medium** of **self-discipline** than a way to communicate information. Writing the report is important; reading it often is not.

While the last sentence may be a bit too strong, this was an interesting sentiment as it felt naturally portable to the domain of formal methods and specification applied in an engineering context. This is analogous to Lamport's well know quip on writing and mathematics:

> Writing is nature’s way of letting you know how sloppy your thinking is. Mathematics is nature’s way of letting you know how sloppy your writing is.

and has been [re-emphasized](https://www.youtube.com/watch?v=pnfrWPFWbAA) by those across industry e.g. [by Ankush Desai and Marc Brooker](https://cacm.acm.org/practice/systems-correctness-practices-at-amazon-web-services/) at AWS

> First, the act of deeply thinking about and formally writing down distributed protocols forces a structured way of thinking that leads to deeper insights about the structure of protocols and the problem to be solved.

In the setting of Grove's book, as the title suggests, a core themeis about measuring *outputs* of your work, not merely *activity*. For programmers, outputs may be easy to measure concretely e.g. lines of code written, features shipped, bugs fixed, etc. For managers, or, more generally, a broader class of modern knowledge workers, these outputs may be less tangible and harder to measure concretely.

Interestingly, applying this "output-oriented" framework to the above statement, it may be argued that Grove is claiming that a detailed written report (e.g. or a formal specification, analogously) is not necessarily the true *output* of the process of writing the report (if noone reads it, how could it be a true output of value?). Alternatively, the process of writing itself and the *understanding, clarity, and knowledge* gained in the process is one of the key outputs here, though less tangible and harder to measure concretely. I think the statement about not reading written documents is certainly a bit extreme, but there is a valuable element of validity. 

I think this also related to another one of his alternate definitions of "manager", which he calls a *know-how* manager:

> If the manager is a knowledge specialist, a *know-how* manager, his potential for influencing neighboring organizations is enormous. The internal consultant who supplies needed insight to a group struggling with a problem will affect the work and the output of the entire group...Thus, the definition of a "manager" should be broadened: individual contributors, who gather and disseminate know-how and information should also be seen as middle managers, because they exert great power within the organization.

This concept is perhaps somewhat natural to organizations where individual engineers can hold significant influence even if they have not formally assumed a "management" role. But it also emphasizes the broader space of possible outputs one might produce e.g. if disseminating know-how or transferring knowledge to others is one way to increase output of an organization, we can see the writing process similarly e.g. deepening and expanding one's own understanding of a problem by writing (or specifying) is a an activity that later acts to increase output of the organization when others may need to come to understand or extend that problem or system.

Overall, I found Grove's writing a helpful lens to think about the value of writing and formal specification in an engineering context. Especially given that I often find discussions about this topic too often looking for justifications of value based on how a specification can map to a running system implementation, or help test and validate that system more effectively. These are valuable additinal goals, but I find it helpful to separate them from one, core value of developing these kinds of specifications. Even if no-one ever reads them! In more concrete terms, I find the following a helpful thought exercise: if I wrote a detailed formal specification of a problem to the point of convincing myself of the solution, with edge cases and all, and then deleted the specification entirely, would this still have been a valuable process for me and/or the broader organization?