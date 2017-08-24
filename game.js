'use strict';

class Vector {

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(newVector) {
    if (!(newVector instanceof Vector)) {
      throw new Error("Можно прибавлять к вектору только вектор типа Vector");
    }
    return new Vector(this.x + newVector.x, this.y + newVector.y);
  }

  times(multiplier = 1) {
    return new Vector(this.x * multiplier, this.y * multiplier);
  }

}

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (!((pos instanceof Vector) && (size instanceof Vector) && (speed instanceof Vector))) {
      throw new Error("Все параменты должны быть Vector");
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
      throw new Error("Необходим объект типа Actor");
    }

    if (otherObject === this) {
      return false;
    }

    return otherObject.left < this.right && otherObject.top < this.bottom && otherObject.right > this.left && otherObject.bottom > this.top;
  }

  act() {
  }

}

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid.slice();
    this.actors = actors.slice();

    this.player = this.actors.find(item => item.type === 'player');
    this.height = grid.length;
    this.width = Math.max(0, ...this.grid.map(line => line.length));
    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    return this.status !== null && this.finishDelay < 0;
  }

  actorAt(actor) {
    if (!(actor instanceof Actor)) {
      throw new Error("Необходим объект типа Actor");
    }

    return this.actors.find((item) => item.isIntersect(actor));
  }

  obstacleAt(position, size) {
    if (!(position instanceof Vector) || !(size instanceof Vector)) {
      throw new Error("Необходим объект типа Vector");
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
        const fieldType = this.grid[y][x];
        if (fieldType) {
          return fieldType;
        }
      }
    }
  }

  removeActor(actor) {
    this.actors = this.actors.filter(obj => obj !== actor);
  }

  noMoreActors(type) {
    return !this.actors.some(item => item.type === type);
  }

  playerTouched(objType, actor) {
    if (this.status !== null) {
      return;
    }

    if (objType === 'lava' || objType === 'fireball') {
      this.status = 'lost';
    }

    if (objType === 'coin') {
      this.removeActor(actor);

      if (this.noMoreActors('coin')) {
        this.status = "won";
      }
    }
  }

}

class LevelParser {
  constructor(dictionary = {}) {
    this.dictionary = Object.assign({}, dictionary);
  }

  actorFromSymbol(symbol) {
    return this.dictionary[symbol];
  }

  obstacleFromSymbol(symbol) {
    switch (symbol) {
      case "x":
        return "wall";
      case "!":
        return "lava";
    }
  }

  createGrid(plan) {
    return plan.map(row => {
      return row.split('').map(char => this.obstacleFromSymbol(char));
    })
  }

  createActors(plan) {
    const actors = [];
    for (let i = 0; i < plan.length; i++) {
      for (let j = 0; j < plan[i].length; j++) {
        const char = plan[i][j];
        const func = this.actorFromSymbol(char);

        if (typeof func === 'function') {
          const actor = new func(new Vector(j, i));

          if (actor instanceof Actor) {
            actors.push(actor);
          }
        }

      }
    }

    return actors;
  }

  parse(plan) {
    return new Level(this.createGrid(plan), this.createActors(plan));
  }

}

class Fireball extends Actor {
  constructor(position = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(position, new Vector(1, 1), speed);
  }

  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

  act(time, level) {
    const nextPosition = this.getNextPosition(time);
    if (level.obstacleAt(nextPosition, this.size)) {
      this.handleObstacle();
    } else {
      this.pos = nextPosition;
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(position = new Vector(0, 0)) {
    super(position, new Vector(2, 0));
  }
}

class VerticalFireball extends Fireball {
  constructor(position = new Vector(1, 1)) {
    super(position, new Vector(0, 2));
  }
}

class FireRain extends Fireball {
  constructor(position = new Vector(0, 0)) {
    super(position, new Vector(0, 3));
    this.startPosition = position;
  }

  handleObstacle() {
    this.pos = this.startPosition;
  }
}

class Coin extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
    this.basePos = this.pos;

    this.springSpeed = 8;
    this.springDist = 0.07;

    const max = 0;
    const min = 2 * Math.PI;
    this.spring = Math.random() * (max - min) + min;
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector(x = 0, y = 0) {
    return new Vector(x, y + Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.getSpringVector(this.basePos.x, this.basePos.y);
  }

  act(time = 1) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5));
  }

  get type() {
    return 'player';
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
  .then(JSON.parse)
    .then(levels => runGame(levels, parser, DOMDisplay)
      .then(() => alert('Ура, победа! (ваш приз диплом :3)')));