

// favorites array
let favorites = [];

//  track card 
let currentCard = null;

// DOM elements

const pokemonInput = document.getElementById("pokemonInput");

const searchBtn = document.getElementById("searchBtn");
const randomBtn = document.getElementById("randomBtn");
const clearBtn = document.getElementById("clearBtn");

const resultDiv = document.getElementById("result");

const favNavBtn = document.getElementById("favNavBtn");
const closeSidebarBtn = document.getElementById("closeSidebar");
const favoritesSidebar = document.getElementById("favoritesSidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const favoritesContainer = document.getElementById("favoritesContainer");
const favCount = document.getElementById("favCount");


// fetch  from  API using AJAX and display the card


function fetchPokemon(query) {
// input validation: check if input is empty or just whitespace
    if (!query || query.toString().trim() === "") {
        showError("Please enter a Pokémon name or ID first!");
        return; 
    }

    clearError();

// creatinge new AJAX request
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `https://pokeapi.co/api/v2/pokemon/${query.toString().toLowerCase().trim()}`, true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;

        if (xhr.status === 200) {
            addCard(JSON.parse(xhr.responseText));
        } else {
// error handling inform user if API returns 404 or other errors
            showError("Pokémon not found. Try again!");
        }
    };

    xhr.send();
}

// show error message under the search bar
function showError(msg) {
    document.getElementById("errorMsg").textContent = msg;
}

// clear the error message
function clearError() {
    document.getElementById("errorMsg").textContent = "";
}


// DOM manipulation, build and display the pokemon card

function addCard(data) {
// DOM removal, if a card is  showing, remove it before adding a new one
    if (currentCard && currentCard.parentNode) {
        currentCard.parentNode.removeChild(currentCard);
    }

//DOM creation, build a new card element with the fetched data and add it to the page
    const cardEl = buildCard(data);
    currentCard = cardEl;
    resultDiv.appendChild(cardEl); // add to page w no refresh
}


//colors for pokemon types
const typeColors = {
    fire:"#f08030", water:"#6890f0", grass:"#78c850", electric:"#f8d030",
    psychic:"#f85888", ice:"#98d8d8", dragon:"#7038f8", dark:"#705848",
    fairy:"#ee99ac", fighting:"#c03028", poison:"#a040a0", ground:"#e0c068",
    rock:"#b8a038", bug:"#a8b820", ghost:"#705898", steel:"#b8b8d0",
    normal:"#a8a878", flying:"#a890f0"
};


//pokemon card element
function buildCard(data) {
    const mainType  = data.types[0].type.name;
    const bandColor = typeColors[mainType] || "#2D58A9";

// create the card container
    const card = document.createElement("div");
    card.className = "pokemon-card";

// top colored band with name and id
    const band = document.createElement("div");
    band.className = "card-header-band";
    band.style.background = `linear-gradient(135deg, ${bandColor}cc, ${bandColor}88)`;

    const nameEl = document.createElement("div");
    nameEl.className   = "poke-name";
    nameEl.textContent = data.name;

    const idBadge = document.createElement("div");
    idBadge.className   = "poke-id-badge";
    idBadge.textContent = `#${String(data.id).padStart(3, "0")}`;

    band.append(nameEl, idBadge);

// card body 
    const body = document.createElement("div");
    body.className = "card-body";

// left: pokemon image + type badges
const cardLeft = document.createElement("div");
cardLeft.className = "card-left";

const sprite = document.createElement("img");
sprite.src = data.sprites.front_default || "";
sprite.alt = data.name;

// type badges under the image
const typesRow = document.createElement("div");
typesRow.className = "types-row";
data.types.forEach(t => {
    const badge = document.createElement("span");
    badge.className = "type-badge";
    badge.textContent = t.type.name;
    const c = typeColors[t.type.name] || "#aaa";
    badge.style.background = c + "33";
    badge.style.color      = c;
    badge.style.border     = `1px solid`;
    typesRow.appendChild(badge);
});

cardLeft.append(sprite, typesRow);

// right side: the 5 data fields from the API
    const cardRight = document.createElement("div");
    cardRight.className = "card-right";

// helper function to create a label + value row

    function makeStatRow(label, value) {
        const row = document.createElement("div");
        row.className = "stat-row";
        const lbl = document.createElement("div");
        lbl.className   = "stat-label";
        lbl.textContent = label;
        const val = document.createElement("div");
        val.className   = "stat-value";
        val.textContent = value;
        row.append(lbl, val);
        return row;
    }

// dispaly the 5 stats of the pokemon: species, height, weight, abilities, base experience
    cardRight.appendChild(makeStatRow("Species",   data.species.name));
    cardRight.appendChild(makeStatRow("Height",    `${(data.height / 10).toFixed(1)} m`));
    cardRight.appendChild(makeStatRow("Weight",    `${(data.weight / 10).toFixed(1)} kg`));
    cardRight.appendChild(makeStatRow("Abilities", data.abilities.map(a => a.ability.name).join(", ")));
    cardRight.appendChild(makeStatRow("Base EXP",  data.base_experience ?? "N/A"));

    body.append(cardLeft, cardRight);

// add to favorites 
    const alreadySaved = favorites.some(f => f.name === data.name);
    const actionBtn = document.createElement("button");
    actionBtn.className = "action-btn" + (alreadySaved ? " added" : "");
    actionBtn.innerHTML = alreadySaved ? "Already in Favorites" : "Double-click to Add to Favorites";

    card.append(band, body, actionBtn);

// double click to add to favorites
    actionBtn.addEventListener("dblclick", function () {
        // do nothing if already saved
        if (favorites.some(f => f.name === data.name)) return;
// add to favorites array
        favorites.push({
            name: data.name,
            img:  data.sprites.front_default,
            id:   `#${String(data.id).padStart(3, "0")}`,
            type: mainType,
        });

// update the button look
        actionBtn.innerHTML = "Added to Favorites!";
        actionBtn.className = "action-btn added";

// refresh the sidebar list and count
        renderFavorites();
        updateFavCount();
    });

    return card;
}


//render the favorites list in the sidebar
function renderFavorites() {
    favoritesContainer.innerHTML = "";

// show a message if no favorites yet
    if (favorites.length === 0) {
        const empty = document.createElement("div");
        empty.className = "no-favorites";
        empty.innerHTML = '<i class="bi bi-star"></i>No favorites yet.<br>Search for a Pokemon and double-click to Add to Favorites!';
        favoritesContainer.appendChild(empty);
        return;
    }

// create a card for each favorite
    favorites.forEach((p, index) => {
        const card = document.createElement("div");
        card.className = "fav-card";

        const img = document.createElement("img");
        img.src = p.img;
        img.alt = p.name;

        const info = document.createElement("div");
        info.className = "fav-info";
        info.innerHTML = `<strong>${p.name}</strong><small>${p.id}</small>`;

// remove button
        const removeBtn = document.createElement("button");
        removeBtn.className = "fav-remove";
        removeBtn.title     = "Remove";
        removeBtn.innerHTML = '<i class="bi bi-x"></i>';

// clicking the card searches for that pokemon
        card.addEventListener("click", function (e) {
            if (e.target.closest(".fav-remove")) return;
            pokemonInput.value = p.name;
            fetchPokemon(p.name);
            closeSidebar();
        });

// clicking x removes it from favorites
        removeBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            removeFavorite(index);
        });

        card.append(img, info, removeBtn);
        favoritesContainer.appendChild(card);
    });
}

// removes a favorite by index and re-renders the list
function removeFavorite(index) {
    favorites.splice(index, 1);
    renderFavorites();
    updateFavCount();
}

// updates the number badge on the favorites button
function updateFavCount() {
    favCount.textContent = favorites.length;
}


//sidebar open and close
function openSidebar() {
    favoritesSidebar.classList.add("open");
    sidebarOverlay.classList.add("visible");
    renderFavorites();
}

function closeSidebar() {
    favoritesSidebar.classList.remove("open");
    sidebarOverlay.classList.remove("visible");
}


//event listeners

//click events
searchBtn.addEventListener("click", function () {
    fetchPokemon(pokemonInput.value);
});

randomBtn.addEventListener("click", function () {
// pick a random pokemon id between 1 and 1025
    const randomId = Math.floor(Math.random() * 1025) + 1;
    pokemonInput.value = randomId;
    fetchPokemon(randomId);
});

clearBtn.addEventListener("click", function () {
// remove the card from the page
    if (currentCard && currentCard.parentNode) {
        currentCard.parentNode.removeChild(currentCard);
    }
    currentCard = null;
    pokemonInput.value = "";
});

favNavBtn.addEventListener("click", openSidebar);
closeSidebarBtn.addEventListener("click", closeSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);

//pressing enter in the search box
pokemonInput.addEventListener("keyup", function (e) {
    if (e.key === "Enter") fetchPokemon(pokemonInput.value);
});

window.addEventListener("DOMContentLoaded", function () {
    renderFavorites();
    updateFavCount();
});
