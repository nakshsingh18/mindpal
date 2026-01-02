// src/assets/animations/index.ts
import angryCat from './cat/angry.json';
import calmCat from './cat/calm.json';
import happyCat from './cat/happy.json';
import dancingCat from './cat/dancing.json';
import hungryCat from './cat/hungry.json';
import sadCat from './cat/sad.json';

import angryDog from './dog/angry.json';
import calmDog from './dog/calm.json';
// ... repeat for dog, penguin, rabbit

export const Animations = {
  cat: { angry: angryCat, calm: calmCat, happy: happyCat, dancing: dancingCat, hungry: hungryCat, sad: sadCat },
  dog: { angry: angryDog, calm: calmDog /* ... */ },
  penguin: { /* ... */ },
  rabbit: { /* ... */ },
};
