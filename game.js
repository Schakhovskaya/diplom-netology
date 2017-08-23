'use strict';

class Vector {

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(newVector) {
    if (!(newVector instanceof Vector)) {
      throw new SyntaxError("Можно прибавлять к вектору только вектор типа Vector");
    }
    // тут не нужен else
    // если выполнение зайдёт в if,
    // то будет выброшено исключение и выполнение метода прекратится
    else {
      return new Vector(this.x + newVector.x, this.y + newVector.y);
    }
  }

  // у аргумента можно добавить значение по умолчанию 1
  times(multiplier) {
    return new Vector(this.x * multiplier, this.y * multiplier);
  }

}

class Actor {
  // для скорости тоже лучше использовать new Vector(0,0)
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector()) {
    if (!((pos instanceof Vector) && (size instanceof Vector) && (speed instanceof Vector))) {
      throw new SyntaxError("Все параменты должны быть Vector");
    }

    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }

  get type() {
    return 'actor';
  }

  get left() {
    return this.pos.x;
  }

  get top() {
    return this.pos.y;
  }

  get right() {
    return this.pos.x + this.size.x;
  }

  get bottom() {
    return this.pos.y + this.size.y;
  }

  isIntersect(otherObject) {
    if (!(otherObject instanceof Actor)) {
      throw new SyntaxError("Необходим объект типа Actor");
    }
    // else лишний
    // вообще тут всё что ниже можно заменить на return <expr>
    // в вашем случае только придётся обратить условие
    else {
      if ((otherObject.left >= this.right || otherObject.top >= this.bottom || otherObject.right <= this.left || otherObject.bottom <= this.top) || (otherObject === this)) {
        return false;
      }
    }
    return true;
  }

  act() {
  }

}

class Level {
  constructor(grid = [], actors = []) {
    // здесь лучше создать копию массива, чтобы нельзя было изменить поле класса снаружи
    // Пример:
    //   const grid = [1];
    //   const level = new Level(grid);
    //   grid.push(2);
    //   console.log(level.grid); //-> [1,2]
    this.grid = grid;
    this.actors = actors;

    // find принимает функцию, которая должна возвращать true/false
    // ваша сейчас возвращает object/undefined
    // + тут лучше использовать стрелочную функцию
    this.player = this.actors.find(function(actor) {
      if (actor.type === 'player') return actor;
    });
    this.height = grid.length;
    // попробуйте переписать эту строчку с использованием Math.max и map - будет классно
    this.width = grid.reduce((width, line) => line.length > width ? line.length : width, 0);
    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    // все скобки лишние :)
    return ((this.status !== null) && (this.finishDelay < 0));
  }

  actorAt(actor) {
    if (!(actor instanceof Actor)) {
      throw new SyntaxError("Необходим объект типа Actor");
    }

    // а вот тут лучше подойдёт find
    for (let newActor of this.actors) {
      if (actor.isIntersect(newActor)) {
        return newActor;
      }
    }

    return undefined;
  }

  obstacleAt(position, size) {
    if (!(position instanceof Vector) || !(size instanceof Vector)) {
      throw new SyntaxError("Необходим объект типа Vector");
    }

    // похоже тут где-то закралось неправильное округление (ceil вместо floor или наоборот)
    let xStart = Math.floor(position.x);
    let xEnd = Math.ceil(position.x + size.x);
    let yStart = Math.floor(position.y);
    let yEnd = Math.ceil(position.y + size.y);

    if (xStart < 0 || xEnd > this.width || yStart < 0) {
      return "wall";
    }

    if (yEnd > this.height) {
      return "lava";
    }

    for (let y = yStart; y < yEnd; y++) {
      for (let x = xStart; x < xEnd; x++) {
        // переменную объявили, но не используете её (лучше использовать)
        // обращайте внимание на let/const -
        // если переменная не меняется, то нужно использовать const
        // на это обращают при дальнейшей проверке диплома
        let fieldType = this.grid[y][x];
        // здесь можно не сравнивать с undefined, а написать просто if (...)
        if (this.grid[y][x] !== undefined) {
          return this.grid[y][x];
        }
      }
    }
  }

  removeActor(actor) {
    // стрелочная функция тут лучше бы смотрелась
    this.actors = this.actors.filter(function(obj) {
      return obj !== actor;
    });
  }

  noMoreActors(type) {
    // тут в одну красивую строчку можно используя some
    if (this.actors.length === 0) {
      return true;
    }

    for (let actor of this.actors) {
      if (actor.type === type) {
        return false;
      }
    }
    return true;
  }

  playerTouched(objType, actor) {
    // тут можно обратить условие, добавить return и вложенность
    // Пример:
    // if (expr) {
    //   if (otherExpr) {
    //     ...
    //   } else {
    //     ...
    //   }
    // }
    // превращается в
    // if (!expr) {
    //   return;
    // }
    // if (otherExpr) {
    //   ...
    //   return;
    // }
    // ...

    if (this.status === null) {
      if (objType === 'lava' || objType === 'fireball') {
        this.status = 'lost';
      } else if (objType === 'coin') {
        this.removeActor(actor);
        if (this.noMoreActors('coin')) {
          this.status = 'won';
        }
      }
    }
  }

}

class LevelParser {
  // у аргемента лучше добавить значение по-умолчанию для аргумента (пустой объект)
  constructor(dictionary) {
    // здесь лучше копировать объект (см. выше про массивы)
    this.dictionary = dictionary;
  }

  actorFromSymbol(symbol) {
    // проверка лишняя
    if (symbol === undefined){
      return undefined;
    }
    else {
      return this.dictionary[symbol];
    }
  }

  obstacleFromSymbol(symbol) {
    if (symbol === "x") {
      return "wall";
    }
    // else лишний
    else if (symbol === "!")
    { return "lava"; }
    else {
      // лишняя строчка
      return undefined;
    }

    // тут вообще можно на switch заменить, чтобы продемонстрировать умение работать с ним :)
  }

  // значение по-умолчанию
  createGrid(strings) {
    // можно обойтись без этой проверки
    if (strings.length < 1) {
      return [];
    }

    // не объявляйте переменные через запятую, так код сложнее читается и модифицируется
    let grid = [], row;
    // for of - не самая популярная конструкци, тут лучше какую-нибудь комбинацию из map/reduce или forEach
    for (let string of strings) {
      row = [];
      for (let char of string) {
        row.push(this.obstacleFromSymbol(char));
      }
      grid.push(row);
    }

    return grid;
  }

  createActors(strings) {
    // не объявляйте переменные через запятую,
    // в данном случае лучше объявлять их лучше там, где они используются
    let actor, actors = [], char, func;
    for (let i = 0; i < strings.length; i++) {
      for (let j = 0; j < strings[i].length; j++) {
        char = strings[i][j];
        // от try тут нужно издавиться
        // (проверить, что возвращается функция перед попыткой её вызвать)
        try {
          func = this.actorFromSymbol(char);
          actor = new func(new Vector(j, i));
          if (actor instanceof Actor) {
            actors.push(actor);
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
    return actors;
  }

  // аргумент обычно называют plan вместо strings (не принципиально)
  parse(strings) {
    return new Level(this.createGrid(strings), this.createActors(strings));
  }

}

class Fireball extends Actor {
  constructor(position = new Vector(0,0), speed = new Vector(0,0)) {
    super(position, new Vector(1, 1), speed);
    // ой-ой-ой зачеи? Сделайте get type() { } это тоже самое
    Object.defineProperty(this, "type", {configurable: true, value: "fireball", writable: false});
  }

  getNextPosition(time = 1) {
    // тут лучше использовать plus и times
    return new Vector(this.pos.x + this.speed.x * time, this.pos.y + this.speed.y * time);
  }

  handleObstacle() {
    // тут times
    this.speed = new Vector(-this.speed.x, -this.speed.y);
  }

  act(time, level) {
    // const же
    let nextPosition = this.getNextPosition(time);
    if (level.obstacleAt(nextPosition, this.size)) {
      this.handleObstacle();
    }
    // лучше не переносить else на следующию строчку
    else {
      this.pos = nextPosition;
    }
  }
}

class HorizontalFireball extends Fireball {
  // этот конструктор должен принимать 1 аргумент
  constructor(position = new Vector(0,0), speed = new Vector(2, 0)) {
    super(position, speed);
  }
}

class VerticalFireball extends Fireball {
  // этот конструктор должен принимать 1 аргумент
  constructor(position = new Vector(1,1), speed = new Vector(0, 2)) {
    super(position, speed);
  }
}

class FireRain extends Fireball {
  // этот конструктор должен принимать 1 аргумент
  constructor(position = new Vector(0,0), speed = new Vector(0, 3)) {
    super(position, speed);
    this.startPosition = position;
  }

  handleObstacle() {
    this.pos = this.startPosition;
  }
}

class Coin extends Actor{
  constructor(position = new Vector(0,0)) {
    super(new Vector(position.x + 0.2, position.y + 0.1), new Vector(0.6, 0.6));
    // get type() { ... }
    Object.defineProperty(this, "type", {configurable: true, value: "coin", writable: false});

    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = 2 * Math.PI * Math.random();
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time) {
    this.updateSpring(time);
    return this.pos.plus(this.getSpringVector());
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(pos = new Vector(0,0)) {
    super(pos, new Vector(0.8, 1.5));
    this.pos.y = pos.y - 0.5;
    // get type()
    Object.defineProperty(this, "type", {
      value: 'player',
    });
  }
}

const actorDict = {
  '@': Player,
  '=': HorizontalFireball,
  'v': FireRain,
  '|': VerticalFireball,
  'o': Coin
};
const parser = new LevelParser(actorDict);

loadLevels()
  // когда цепочка вызовов лучше добавлять отступы, чтобы было видно, что это один блок кода
.then(JSON.parse)
.then(levels => runGame(levels, parser, DOMDisplay)
.then(() => alert('Ура, победа! (ваш приз диплом :3)')));
