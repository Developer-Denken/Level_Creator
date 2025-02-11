let canvas = document.getElementById("levelCanvas");
let paint = canvas.getContext("2d");

//need to see when the user right clicks to create a new item
let blocks = [];

class Block {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = "#000000";
        this.dragging = false;
        this.initialX = 0;
        this.initialY = 0;
        this.initialPosition = {x: 0, y: 0};
        this.corners = false;
        this.stationary = 0;
        this.editing = false;
        this.type = "block";
        this.order = blocks.length;
        this.connection = 0;
        this.hasSwap = "false";
        this.childBlocks = [];
        this.texture = "base.brick";
    }
}

let lastMousePosition = {x: 0, y: 0};

let cameraPosition = {x: 0, y: 0};

let selectedBlockIndex = -1; //-1 = user has not selected any block
let editingIndex = -1;
let pointPositions = [[0, 0],
                      [1, 0],
                      [1, 1],
                      [0, 1]]; //These are where all of the blocks blue shape editing boxes are
let editBlockShape = [corners, sides];

//need to create a box class that allows flexible creation (not unlike the view class in the android studio)

let contextMenu = document.getElementById("context-menu");

canvas.addEventListener('contextmenu', function(e) {
    e.preventDefault();

    contextMenu.style.visibility = "visible";

    //sets the position of the element next to the mouse

    let mouseX = e.clientX;
    let mouseY = e.clientY;

    contextMenu.style.left = mouseX + "px";
    contextMenu.style.top = mouseY + "px";

    lastMousePosition.x = mouseX;
    lastMousePosition.y = mouseY;
});

canvas.addEventListener('mouseup', function(e) {
    let mouseX = e.clientX - canvas.getBoundingClientRect().left + cameraPosition.x;
    let mouseY = e.clientY - canvas.getBoundingClientRect().top + cameraPosition.y;

    for(let i = 0;!(selectedBlockIndex!=-1&&blocks[selectedBlockIndex].editing)&&e.button==0&&i<blocks.length;i++) {
        let block = blocks[i];
        block.dragging = false;
        if(pointInBox(mouseX, mouseY, block.x, block.y, block.width, block.height)) {
            selectedBlockIndex = i;
            showBlockProperties();
            renderBlocks();
            break;
        } else {
            selectedBlockIndex = -1;
            hideBlockProperties();
            if(i==blocks.length-1) renderBlocks();
        }
    }
    cancelEditing();
});

canvas.addEventListener("mousedown", function(e) {
    let mouseX = e.clientX - canvas.getBoundingClientRect().left + cameraPosition.x;
    let mouseY = e.clientY - canvas.getBoundingClientRect().top + cameraPosition.y;

    if(e.button != 0||selectedBlockIndex==-1) return;

    let block = blocks[selectedBlockIndex];
    let point = -1;

    for(let j = 0;j<pointPositions.length;j++) {
        if(pointInBox(mouseX, mouseY, block.x+pointPositions[j][0]*block.width-5, block.y+pointPositions[j][1]*block.height-5, 10, 10)) {
            point = j;
        }
    }

    editingIndex = point;
    if(point!=-1) editBlockShape[Number(!(point<4))](block, {x: mouseX, y: mouseY}, point);

    if(pointInBox(mouseX, mouseY, block.x, block.y, block.width, block.height)) {
        block.initialX = mouseX - block.x;
        block.initialY = mouseY - block.y;
        block.dragging = !block.corners;
    }
});

canvas.addEventListener("mousemove", function(e) {
    let mouseX = e.clientX - canvas.getBoundingClientRect().left + cameraPosition.x;
    let mouseY = e.clientY - canvas.getBoundingClientRect().top + cameraPosition.y;

    if(selectedBlockIndex!=-1&&blocks[selectedBlockIndex].corners) editCorners({x: mouseX, y: mouseY}, blocks[selectedBlockIndex]);

    let block = -1;

    for(let i = 0;i<blocks.length;i++) if(blocks[i].dragging) block = blocks[i];

    if(block == -1) return;

    mouseX -= block.initialX;
    mouseY -= block.initialY;

    for(let i = 0;i<block.childBlocks.length;i++) {
        let childBlock = block.childBlocks[i];

        childBlock.initialX = childBlock.x - block.x;
        childBlock.initialY = childBlock.y - block.y;

        childBlock.x = mouseX + childBlock.initialX;
        childBlock.y = mouseY + childBlock.initialY;
    }

    block.x = mouseX;
    block.y = mouseY;

    renderBlocks();
});

contextMenu.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

document.addEventListener("mousedown", function(e) {
    // let mouseX = e.clientX;
    // let mouseY = e.clientY;

    // let box = contextMenu.getBoundingClientRect();

    //if(pointInBox(mouseX, mouseY, box.left, box.top, box.width, box.height)) return;

    contextMenu.style.visibility = "hidden";
});

function pointInBox(x, y, bx, by, bw, bh) {
    if(x>bx&&x<bx+bw&&y>by&&y<by+bh) return true;
    return false;
}

let children = [...contextMenu.children];

function createNewBlock(e) {
    let newBlock = new Block(lastMousePosition.x-canvas.getBoundingClientRect().left+cameraPosition.x, lastMousePosition.y-canvas.getBoundingClientRect().top+cameraPosition.y, 50, 50);
    blocks.push(newBlock);
    renderBlocks();
}

function createNewSpawnPoint(e) {
    let newSpawnPoint = new Block(lastMousePosition.x-canvas.getBoundingClientRect().left+cameraPosition.x, lastMousePosition.y+cameraPosition.y-canvas.getBoundingClientRect().top, 50, 50);
    newSpawnPoint.type = "spawnpoint";
    newSpawnPoint.color = "#9CCC65";
    blocks.push(newSpawnPoint);
    renderBlocks();
}

let swapButtonCount = 0;

function createNewSwapButton(e) {
    let newSwapButton = new Block(lastMousePosition.x-canvas.getBoundingClientRect().left+cameraPosition.x, lastMousePosition.y+cameraPosition.y-canvas.getBoundingClientRect().top, 100, 20)
    newSwapButton.type = "swapbutton";
    newSwapButton.color = "#FFFF00";
    newSwapButton.hasSwap = "true";
    newSwapButton.childBlocks.push(new Block(newSwapButton.x + 25, newSwapButton.y - 25, 50, 25));
    newSwapButton.connection = swapButtonCount+1;

    let newSwapButton2 = new Block(lastMousePosition.x-canvas.getBoundingClientRect().left+cameraPosition.x, lastMousePosition.y+cameraPosition.y-canvas.getBoundingClientRect().top, 100, 20)
    newSwapButton2.type = "swapbutton";
    newSwapButton2.color = "#FFFF00";
    newSwapButton2.connection = swapButtonCount;
    swapButtonCount+=2;
    blocks.push(newSwapButton, newSwapButton2);
    renderBlocks();
}

function createNewCheckPoint(e) {
    let newBlock = new Block(lastMousePosition.x-canvas.getBoundingClientRect().left+cameraPosition.x, lastMousePosition.y-canvas.getBoundingClientRect().top+cameraPosition.y, 50, 50);
    newBlock.color = "#00FF00";
    newBlock.type = "checkpoint";
    blocks.push(newBlock);
    renderBlocks();
}

let buttonFunctions = [createNewBlock, createNewSpawnPoint, createNewSwapButton, createNewCheckPoint];

for(let i = 0;i<children.length;i++) {
    children[i].addEventListener("mousedown", function(e) {
        if(e.button != 0) return;
        
        buttonFunctions[i](e);
    });
}

function renderBlocks() {
    paint.fillStyle = "white";
    paint.fillRect(0, 0, 1600, 900);

    for(let i = 0;i<blocks.length;i++) {
        let block = blocks[i];
        paint.fillStyle = block.color;
        paint.fillRect(block.x-cameraPosition.x, block.y-cameraPosition.y, block.width, block.height);

        for(let j = 0;j<blocks[i].childBlocks.length;j++) {
            let tempBlock = blocks[i].childBlocks[j];
            paint.fillStyle = tempBlock.color;
            paint.fillRect(tempBlock.x-cameraPosition.x, tempBlock.y-cameraPosition.y, tempBlock.width, tempBlock.height);
        }

        if(i!=selectedBlockIndex) continue;

        paint.fillStyle = "blue";
        for(let j = 0;j<pointPositions.length;j++) {
            paint.fillRect(block.x-cameraPosition.x+pointPositions[j][0]*block.width-5, block.y-cameraPosition.y+pointPositions[j][1]*block.height-5, 10, 10);
        }
    }
    showBlockProperties()
}

function corners(block, pos, point) {
    block.corners = true;
    block.editing = true;
    block.initialPosition = pos;
    block.stationary = (point+2)%4;
}

function sides(block, pos, point) {
}

function editCorners(pos, block) {
    let x = block.x + pointPositions[block.stationary][0]*block.width;
    let y = block.y + pointPositions[block.stationary][1]*block.height;

    let corner1 = {x: x, y: y};
    let corner2 = pos;

    let rect = genRectFromCorners(corner1, corner2);

    block.x = rect.x;
    block.y = rect.y;
    block.width = rect.width;
    block.height = rect.height;
    renderBlocks();
}

function genRectFromCorners(corner1, corner2) {
    let x = Math.min(corner1.x, corner2.x);
    let y = Math.min(corner1.y, corner2.y);
    let width = Math.abs(corner1.x - corner2.x);
    let height = Math.abs(corner1.y - corner2.y);

    if(width == 0) width = 1;
    if(height == 0) height = 1;

    return {x: x, y: y, width: width, height: height};
}

function cancelEditing() {
    if(selectedBlockIndex==-1) return;
    blocks[selectedBlockIndex].corners = false;
    blocks[selectedBlockIndex].editing = false;
}

let blockPropertiesBox = document.getElementById("propertiesBox");

let xp = document.getElementById("x");
let yp = document.getElementById("y");
let widthp = document.getElementById("width");
let heightp = document.getElementById("height");
let colorp = document.getElementById("color");
let typep = document.getElementById("type");
let orderp = document.getElementById("order");
let hasSwapp = document.getElementById("hasSwap");

document.querySelectorAll("input").forEach(item => {
    item.addEventListener("blur", function(e) {
        switch(item.id) {
            case "x":
                for(let i = 0;i<blocks[selectedBlockIndex].childBlocks.length;i++) {
                    let temp = blocks[selectedBlockIndex].childBlocks[i];

                    temp.x -= blocks[selectedBlockIndex].x - parseInt(item.value);
                }
                blocks[selectedBlockIndex].x = parseInt(item.value);
                break;
            case "y":
                for(let i = 0;i<blocks[selectedBlockIndex].childBlocks.length;i++) {
                    let temp = blocks[selectedBlockIndex].childBlocks[i];

                    temp.y -= blocks[selectedBlockIndex].y - parseInt(item.value);
                }
                blocks[selectedBlockIndex].y = parseInt(item.value);
                break;
            case "width":
                blocks[selectedBlockIndex].width = parseInt(item.value);
                break;
            case "height":
                blocks[selectedBlockIndex].height = parseInt(item.value);
                break;
            case "color":
                blocks[selectedBlockIndex].color = item.value;
                break;
            case "type":
                blocks[selectedBlockIndex].type = item.value;
                break;
            case "order":
                blocks[selectedBlockIndex].order = item.value;
                break;
            case "hasSwap":
                if(item.value == "true" && blocks[selectedBlockIndex].hasSwap != "true") {
                    blocks[selectedBlockIndex].childBlocks.push(new Block(blocks[selectedBlockIndex].x + 25, blocks[selectedBlockIndex].y - 25, 50, 25));
                } else if(item.value != "true" && blocks[selectedBlockIndex].hasSwap == "true") {
                    blocks[selectedBlockIndex].childBlocks = [];
                }
                blocks[selectedBlockIndex].hasSwap = item.value;
                break;
        }
        renderBlocks();
    });
});

function showBlockProperties() {
    if(selectedBlockIndex == -1) return;
    let block = blocks[selectedBlockIndex];

    xp.value = block.x;
    yp.value = block.y;
    widthp.value = block.width;
    heightp.value = block.height;
    colorp.value = block.color;
    typep.value = block.type;
    orderp.value = block.order;
    hasSwapp.value = block.hasSwap;
    blockPropertiesBox.style.visibility = "visible";
}

function hideBlockProperties() {
    blockPropertiesBox.style.visibility = "hidden";
}

let moving = false;
let keys = [0, 0, 0, 0];
let cameraSpeed = 4;
let alreadyMoving = false;
let edit = false;

document.querySelectorAll("input").forEach(input => {
    input.addEventListener('input', function() {
        edit = true;
        keys = [0, 0, 0, 0];
    });
    input.addEventListener('focusout', function() {
        edit = false;
    });
});

document.addEventListener("keydown", function(e) {
    if(edit) return;
    let key = e.key.toUpperCase();
    if(key == "W") {
        keys[0] = 1;
    }
    if(key == "S") {
        keys[2] = 1;
    }
    if(key == "D") {
        keys[3] = 1;
    }
    if(key == "A") {
        keys[1] = 1;
    }

    moving = !(keys[0]==0&&keys[1]==0&&keys[2]==0&&keys[3]==0);
    if(moving && !alreadyMoving) move();
});

document.addEventListener("keyup", function(e) {
    if(edit) return;
    let key = e.key.toUpperCase();
    if(key == "W") {
        keys[0] = 0;
    }
    if(key == "S") {
        keys[2] = 0;
    }
    if(key == "D") {
        keys[3] = 0;
    }
    if(key == "A") {
        keys[1] = 0;
    }

    moving = !(keys[0]==0&&keys[1]==0&&keys[2]==0&&keys[3]==0);
    alreadyMoving = moving;
});

function move() {
    if(!moving) return;
    alreadyMoving = true;

    if(keys[0]) cameraPosition.y -= cameraSpeed;
    if(keys[1]) cameraPosition.x -= cameraSpeed;
    if(keys[2]) cameraPosition.y += cameraSpeed;
    if(keys[3]) cameraPosition.x += cameraSpeed;

    renderBlocks();

    setTimeout(move, 20);
}

function deleteBlock() {
    if(blocks[selectedBlockIndex].type == "swapbutton") swapButtonCount--;
    blocks.splice(selectedBlockIndex, 1);
    selectedBlockIndex = -1;
    hideBlockProperties();
    cancelEditing();
    renderBlocks();
}

let outputBox = document.getElementById("outputBox");

function save() {
    //takes all of the block objects and translates them into the language that can be read by the game
    let output = "Level_ID: 0\nCheck_Point: {Length: ";
    let checkPoints = [];
    let solidBlocks = [];
    let spawnPoints = [];
    let swapBlocks = [];

    for(let i = 0;i<blocks.length;i++) {
        let block = blocks[i];
        switch(block.type) {
            case "checkpoint":
                checkPoints.push(block);
                break;
            case "block":
                solidBlocks.push(block);
                break;
            case "spawnpoint":
                spawnPoints.push(block);
                break;
            case "swapbutton":
                swapBlocks.push(block);
                break;
        }
    }

    output += spawnPoints.length + ";-\n"

    for(let i = 0;i<spawnPoints.length;i++) {
        let block = spawnPoints[i];
        output+="Point"+i+": {X: " + block.x + ";Y: " + block.y + "}";
        if(i!=spawnPoints.length-1) output+=";-\n";
        else output+="}\n";
    }

    output += "Background: image file and path\nMap_Blocks: {Length: " + solidBlocks.length + ";-\n";

    for(let i = 0;i<solidBlocks.length;i++) {
        let block = solidBlocks[i];
        output+="Block"+i+": {Color: " + block.color + ";Location: {X: " + block.x + ";Y: " + block.y + "};Size: {Width: " + block.width + ";Height: " + block.height + "};Texture: " + block.texture +"}";
        if(i!=solidBlocks.length-1) output+=";-\n";
        else output+="}\n";
    }

    output += "Check_Point_Blocks: {Length: " + checkPoints.length + ";-\n";

    for(let i = 0;i<checkPoints.length;i++) {
        let block = checkPoints[i];
        output+="CheckPoint"+i+": {Link: " + i + ";Location: {X: " + block.x + ";Y: " + block.y + "};Size: {Width: " + block.width + ";Height: " + block.height + "};Visible: true}";
        if(i!=checkPoints.length-1) output+=";-\n";
        else output+="}\n";
    }

    output += "Swap_Buttons: {Length: " + swapBlocks.length + ";-\n";

    for(let i = 0;i<swapBlocks.length;i++) {
        let block = swapBlocks[i];
        output+="Button" + i + ": {Location: {X: " + block.x + ";Y: " + block.y + "};Link: " + block.connection + ";HasSwap: " + block.hasSwap + "}";
        if(i!=swapBlocks.length-1) output+=";-\n";
        else output+="}\n";
    }

    outputBox.value = output;
}