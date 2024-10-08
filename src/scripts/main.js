"use strict";

import { Grid } from "../modules/grid.class.js";
import { Tile } from "../modules/tile.class.js";

const buttonStart = document.querySelector("button");
const gameBoard = document.getElementById("game-board");
const grid = new Grid(gameBoard);

const messageWin = document.querySelector(".message__text--win");
const messageLose = document.querySelector(".message__text--lose");
const messageStart = document.querySelector(".message__text--start");

const gameScore = document.querySelector(".game__score");

function customConfirm(message) {
  return new Promise((resolve) => {
    const confirmModal = document.querySelector(".modal");
    const confirmMessage = document.querySelector(".modal__message");
    const confirmYes = document.querySelector(".modal__button--yes");
    const confirmNo = document.querySelector(".modal__button--no");

    confirmMessage.textContent = message;
    confirmModal.classList.remove("hidden");

    confirmYes.onclick = () => {
      confirmModal.classList.add("hidden");
      resolve(true);
    };

    confirmNo.onclick = () => {
      confirmModal.classList.add("hidden");
      resolve(false);
    };
  });
}

buttonStart.addEventListener("click", async () => {
  if (buttonStart.classList.contains("game__button--restart")) {
    document.removeEventListener("keydown", handleInput);

    const result = await customConfirm(
      "Are you sure you want to restart the game? All progress will be lost.",
    );

    if (result) {
      restartGame();
    } else {
      setupInput();
    }
  } else {
    buttonStart.classList.remove("game__button--start");
    buttonStart.classList.add("game__button--restart");
    buttonStart.innerHTML = "Restart";

    restartGame();

    messageStart.classList.add("hidden");
  }
});

function setupInput() {
  document.addEventListener("keydown", handleInput, { once: true });
}

async function handleInput(e) {
  switch (e.key) {
    case "ArrowUp":
      if (!canMoveUp()) {
        setupInput();

        return;
      }
      await moveUp();
      break;

    case "ArrowDown":
      if (!canMoveDown()) {
        setupInput();

        return;
      }
      await moveDown();
      break;

    case "ArrowLeft":
      if (!canMoveLeft()) {
        setupInput();

        return;
      }
      await moveLeft();
      break;

    case "ArrowRight":
      if (!canMoveRight()) {
        setupInput();

        return;
      }
      await moveRight();
      break;

    default:
      setupInput();

      return;
  }

  grid.cells.forEach((cell) => {
    if (cell.linkedTileForMerge) {
      cell.mergeTiles();
    }
  });
  gameScore.textContent = grid.totalScore;

  if (grid.lastMerge === 2048) {
    messageWin.classList.remove("hidden");

    return;
  }

  const newTile = new Tile(gameBoard);

  grid.getRandomEmptyCell().linkTile(newTile);

  if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
    newTile.waitForTransitionEnd(true).then(() => {
      messageLose.classList.remove("hidden");
    });

    return;
  }
  setupInput();
}

async function moveUp() {
  await slideTiles(grid.cellsByCol);
}

async function moveDown() {
  await slideTiles(grid.cellsByReversedCol);
}

async function moveLeft() {
  await slideTiles(grid.cellsByRow);
}

async function moveRight() {
  await slideTiles(grid.cellsByReversedRow);
}

function slideTiles(groupedCells) {
  return Promise.all(
    groupedCells.flatMap((group) => {
      const promises = [];

      for (let i = 0; i < group.length; i++) {
        if (!group[i].linkedTile) {
          continue;
        }

        const cellWithTile = group[i];
        let lastValidCell;

        for (let j = i - 1; j >= 0; j--) {
          const moveToCell = group[j];

          if (!moveToCell.canAccept(cellWithTile.linkedTile)) {
            break;
          }
          lastValidCell = moveToCell;
        }

        if (lastValidCell) {
          promises.push(cellWithTile.linkedTile.waitForTransitionEnd());

          if (lastValidCell.linkedTile) {
            lastValidCell.linkTileForMerge(cellWithTile.linkedTile);
          } else {
            lastValidCell.linkTile(cellWithTile.linkedTile);
          }
          cellWithTile.linkedTile = null;
        }
      }

      return promises;
    }),
  );
}

function canMoveUp() {
  return canMove(grid.cellsByCol);
}

function canMoveDown() {
  return canMove(grid.cellsByReversedCol);
}

function canMoveLeft() {
  return canMove(grid.cellsByRow);
}

function canMoveRight() {
  return canMove(grid.cellsByReversedRow);
}

function canMove(groupedCells) {
  return groupedCells.some((group) => {
    return group.some((cell, index) => {
      if (index === 0) {
        return false;
      }

      if (!cell.linkedTile) {
        return false;
      }

      const targetCell = group[index - 1];

      return targetCell.canAccept(cell.linkedTile);
    });
  });
}

function restartGame() {
  grid.reset();
  grid.totalScore = 0;
  gameScore.textContent = grid.totalScore;

  grid.getRandomEmptyCell().linkTile(new Tile(gameBoard));
  grid.getRandomEmptyCell().linkTile(new Tile(gameBoard));

  messageLose.classList.add("hidden");

  if (!messageWin.classList.contains("hidden")) {
    messageWin.classList.add("hidden");
  }
  setupInput();
}
