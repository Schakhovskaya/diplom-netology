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
    else {
      return new Vector(this.x + newVector.x, this.y + newVector.y);
    }
  }

  times(multiplier) {
    return new Vector(this.x * multiplier, this.y * multiplier);
  }

}

class Actor {

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
    this.grid = grid;
    this.actors = actors;
    this.player = this.actors.find(function(actor) {
      if (actor.type === 'player') return actor;
    });
    this.height = grid.length;
    this.width = grid.reduce((width, line) => line.length > width ? line.length : width, 0);
    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    return ((this.status !== null) && (this.finishDelay < 0));
  }

  actorAt(actor) {
    if (!(actor instanceof Actor)) {
      throw new SyntaxError("Необходим объект типа Actor");
    }

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
        let fieldType = this.grid[y][x];
        if (this.grid[y][x] !== undefined) {
          return this.grid[y][x];
        }
      }
    }
  }

  removeActor(actor) {
    this.actors = this.actors.filter(function(obj) {
      return obj !== actor;
    });
  }

  noMoreActors(type) {

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
  constructor(dictionary) {
    this.dictionary = dictionary;
  }

  actorFromSymbol(symbol) {
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
    else if (symbol === "!")
    { return "lava"; }
    else {
      return undefined;
    }
  }

  createGrid(strings) {
    if (strings.length < 1) {
      return [];
    }

    let grid = [], row;
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
    let actor, actors = [], char, func;
    for (let i = 0; i < strings.length; i++) {
      for (let j = 0; j < strings[i].length; j++) {
        char = strings[i][j];
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

  parse(strings) {
    return new Level(this.createGrid(strings), this.createActors(strings));
  }

}

class Fireball extends Actor {
  constructor(position = new Vector(0,0), speed = new Vector(0,0)) {
    super(position, new Vector(1, 1), speed);
    Object.defineProperty(this, "type", {configurable: true, value: "fireball", writable: false});
  }

  getNextPosition(time = 1) {
    return new Vector(this.pos.x + this.speed.x * time, this.pos.y + this.speed.y * time);
  }

  handleObstacle() {
    this.speed = new Vector(-this.speed.x, -this.speed.y);
  }

  act(time, level) {
    let nextPosition = this.getNextPosition(time);
    if (level.obstacleAt(nextPosition, this.size)) {
      this.handleObstacle();
    }
    else {
      this.pos = nextPosition;
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(position = new Vector(0,0), speed = new Vector(2, 0)) {
    super(position, speed);
  }
}

class VerticalFireball extends Fireball {
  constructor(position = new Vector(1,1), speed = new Vector(0, 2)) {
    super(position, speed);
  }
}

class FireRain extends Fireball {
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
    Object.defineProperty(this, "type", {
      value: 'player',
    });
  }
}



let levels = [
  [
    "                       ",
    "                       ",
    "                       ",
    "                       ",
    "  o                    ",
    "  x           o     o  ",
    "  x @   o   xxxx |xxx  ",
    "  xxxx xxx xx  xxxxxx  "
  ],
  [
    "          ooo          ",
    "          xxx          ",
    "          o xxx        ",
    "         xxx           ",
    "  =   xxx  o           ",
    "  x      xxx       o   ",
    "  x @   o         xxx  ",
    "  xxxx xxx xx | xxxxx  "
  ],
  [
    "          ooo          ",
    "     o    xxx   o      ",
    "     xxx       xxx     ",
    "         xxx       v   ",
    "  =        o           ",
    "  x      xxx       o   ",
    "  x @   o         xxx  ",
    "  xxxx xxx xx | xxxxx  "
  ]

];
const actorDict = {
  '@': Player,
  '=': HorizontalFireball,
  'v': FireRain,
  '|': VerticalFireball,
  'o': Coin
};
const parser = new LevelParser(actorDict);
runGame(levels, parser, DOMDisplay)
.then(() => alert('Вы выиграли приз!'));