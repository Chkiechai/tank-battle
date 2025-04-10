# 2025-04-09 Debugging the multi-enemy problem

Problem: All of the enemies have identical actions, despite having different tank instances and different copies of the code.

Reason: The `globals` struct I was using was not cloned, so every tank had the
same one. Since it has functions that came from Tank (with a bound `this`
pointer), they were all just doing whatever the last tank did.

Solution: Make the globals into an actual class, and give each tank a fresh
instance of it when it's created. This way I have clear and direct control 
over exactly what's in the globals, and it's easy to find where everything 
defined. Otherwise, I was adding items to a typeless object in several 
different places and times, and it was very hard to maintain.

Status: I wrote the class, but it is not integrated.

Next step: Replace all instances of the globals throughout the codebase with
`new Globals(game,tank)`



