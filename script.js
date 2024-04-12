// Originally ~700ms for 100x100

// #region | Elements
const grid_container = document.getElementById("grid");
const creategrid_btn = document.getElementById("creategrid");
const control_btns = document.getElementById("control_buttons");
const instruction_element = document.getElementById("instruction");
const place_obstacle_btn = document.getElementById("place_obstacle");
const place_spawn_btn = document.getElementById("place_spawn");
const place_target_btn = document.getElementById("place_target");
const start_process_btn = document.getElementById("start_process");
// #endregion


// #region | Variables
let mode;
let rows = 5;
let cols = 5;

let player_start;
let player_target;

let obstacles;
// #endregion


// #region | Functions
// Sleep function
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// Clicked on tile
function handleTileClick(event) {
	if (mode === "obstacle") {
		if (event.target.id === player_start || event.target.id === player_target) return;
		if (event.target.classList.contains("obstacle")) {
			event.target.classList.remove("obstacle");
			obstacles.delete(event.target.id);
		} else {
			event.target.classList.add("obstacle");
			obstacles.set(event.target.id);
		}
	} else if (mode === "spawn") {
		if (event.target.classList.contains("obstacle") || event.target.id === player_target) return;
		if (player_start) document.getElementById(player_start).classList.remove("player");
		event.target.classList.add("player");
		player_start = event.target.id;
	} else if (mode === "target") {
		if (event.target.classList.contains("obstacle") || event.target.id === player_start) return;
		if (player_target) document.getElementById(player_target).classList.remove("target");
		event.target.classList.add("target");
		player_target = event.target.id;
	}
}

// Build the grid
function initializeGrid() {
	const start = performance.now();

	// Set rows and columns
	rows = Math.max(Math.min(Number(document.getElementById("gridsize").value), 1000), 5);
	cols = rows;

	// Reset some variables
	player_start;
	player_target;
	obstacles = new Map();

	// Clear entire grid
	grid_container.innerHTML = "";

	// Dynamically changing and calculating CSS
	grid_container.style = `--cols: ${cols}; --rows: ${rows}`;

	// Creating all columns and rows
	for (let y = 0; y > cols * -1; y--) {
		for (let x = 0; x < rows; x++) {
			const tile = document.createElement("div");
			tile.id = x + "_" + y;
			tile.classList.add("tile");
			tile.addEventListener("click", handleTileClick);
			grid_container.appendChild(tile);
		}
	}

	// Unhide controls and rename header
	control_btns.classList.remove("hidden");
	instruction_element.innerText = "Set tiles";

	const end = performance.now();
	console.log(`Generating ${Math.pow(rows, 2)} tiles took ${end - start}ms.`);
}

// Try to find a path between the start and the target
async function pathfind(start, target, wait) {
	const bmstart = performance.now();
	const visited = new Map(); // obj of coord strings
	const queue = new Map(); // obj of coord strings
	let parent = {};

	// Add starting point to the queue
	queue.set(start);

	// Start the loop to continuously check the next queued tile
	while (queue.size > 0) {

		if (wait) await sleep(250);

		// Get 0th queued tile
		const current_tile = queue.keys().next().value; // Is a string (for example "5_-3")
		queue.delete(current_tile);

		// In case the current tile to check is the target
		if (current_tile === target) {
			document.getElementById(current_tile).classList.add("visited");
			const end = performance.now();
			console.log(`Finding a path took ${end - bmstart}ms.`);
			return reconstructPath(parent, start, target, wait);
		}

		// Convert the string into two coordinates for calculations
		const [current_tile_x, current_tile_y] = current_tile.split("_").map(Number);

		// Get coordinates of potential neighbors
		const neighbor_y_up = current_tile_y + 1;
		const neighbor_y_down = current_tile_y - 1;
		const neighbor_x_left = current_tile_x - 1;
		const neighbor_x_right = current_tile_x + 1;

		// Convert the coordinates back to strings
		const neighbor_up = current_tile_x + "_" + neighbor_y_up;
		const neighbor_down = current_tile_x + "_" + neighbor_y_down;
		const neighbor_left = neighbor_x_left + "_" + current_tile_y;
		const neighbor_right = neighbor_x_right + "_" + current_tile_y;

		// Upper neighbor
		if (
			!queue.has(neighbor_up) && // Not queued already
			!visited.has(neighbor_up) && // Not visited yet
			neighbor_y_up <= 0 && // Not out of bounds
			!obstacles.has(neighbor_up) // Not an obstacle
		) {
			queue.set(neighbor_up);
			parent[neighbor_up] = current_tile;
		}

		// Lower neighbor
		if (
			!queue.has(neighbor_down) && // Not queued already
			!visited.has(neighbor_down) && // Not visited yet
			neighbor_y_down > rows * -1 && // Not out of bounds
			!obstacles.has(neighbor_down) // Not an obstacle
		) {
			queue.set(neighbor_down);
			parent[neighbor_down] = current_tile;
		}

		// Left neighbor
		if (
			!queue.has(neighbor_left) && // Not queued already
			!visited.has(neighbor_left) && // Not visited yet
			neighbor_x_left >= 0 && // Not out of bounds
			!obstacles.has(neighbor_left) // Not an obstacle
		) {
			queue.set(neighbor_left);
			parent[neighbor_left] = current_tile;
		}

		// Right neighbor
		if (
			!queue.has(neighbor_right) && // Not queued already
			!visited.has(neighbor_right) && // Not visited yet
			neighbor_x_right < cols && // Not out of bounds
			!obstacles.has(neighbor_right) // Not an obstacle
		) {
			queue.set(neighbor_right);
			parent[neighbor_right] = current_tile;
		}

		// Done adding every neighbor to the queue - Mark current as visited!
		visited.set(current_tile);
		document.getElementById(current_tile).classList.add("visited");
	}
}

// Reconstructing the path that was found
async function reconstructPath(parent, start, target, wait) {
	const bmstart = performance.now();
	let last_tile;
	const path = [];
	while (last_tile !== start) {

		if (wait) await sleep(250);

		// Get path tile accoring to parents object
		const path_tile = (last_tile ? parent[last_tile] : parent[target]);

		// Set last tile to current tile
		last_tile = path_tile;

		// Add path tile to path array
		path.unshift(path_tile);

		// Color in tile
		document.getElementById(path_tile).classList.add("path");
	}
	const end = performance.now();
	console.log(`Reconstructing path took ${end - bmstart}ms.`);

	return path;
}
// #endregion


// #region | Event listeners
creategrid_btn.addEventListener("click", initializeGrid);
place_obstacle_btn.addEventListener("click", () => {
	mode = "obstacle";
	instruction_element.innerText = "Place obstacles";
});
place_spawn_btn.addEventListener("click", () => {
	mode = "spawn";
	instruction_element.innerText = "Place spawn";
});
place_target_btn.addEventListener("click", () => {
	mode = "target";
	instruction_element.innerText = "Place targets";
});
start_process_btn.addEventListener("click", () => {
	if (!player_start || !player_target) return;
	pathfind(player_start, player_target, document.getElementById("use_slowmode").checked);
});
// #endregion


// Find a path from here to there
// pathfind(player_start, player_target);
