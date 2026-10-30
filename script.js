//Settings and state
const USD_TO_BDT = 110; // API prices are in USD
const DELIVERY = 60;
const SHIPPING = 40;
const COUPONS = { SMART10: 0.1 };

let products = [];
let cart = []; // [{ id, title, image, price, qty }]
let discountRate = 0;
let searchText = ""; // Search box-er event-er maddhome update hoy.
let selectedCategory = "all"; // Category event-er maddhome update hoy.
let balance = 1000; // Page load howar shomoy shobshomoy 1000 theke shuru hoy.

const $ = (id) => document.getElementById(id);

function message(text, ok = false) {
  $("msg").textContent = text;
  $("msg").className = "text-sm mt-2 " + (ok ? "text-success" : "text-error");
}

/*LOAD PRODUCTS (API)*/

async function loadProducts() {
  try {
    const res = await fetch("https://fakestoreapi.com/products");
    products = await res.json();

    // fill the category dropdown
    [...new Set(products.map((p) => p.category))].forEach(function (c) {
      $("category").innerHTML += `<option value="${c}">${c}</option>`;
    });

    showProducts();
  } catch {
    $("product-list").innerHTML =
      '<p class="text-error">Could not load products.</p>';
  }
}
/*  SHOW PRODUCTS (search + category) */

function showProducts() {
  const list = products.filter(function (p) {
    return (
      p.title.toLowerCase().includes(searchText) &&
      (selectedCategory === "all" || p.category === selectedCategory)
    );
  });

  $("product-list").innerHTML =
    list
      .map(function (p) {
        return `
    <div class="card bg-base-100 shadow product-card" data-id="${p.id}">
      <figure class="bg-white h-40 p-3"><img src="${p.image}" class="h-full object-contain" /></figure>
      <div class="card-body p-4">
        <h3 class="font-semibold line-clamp-2">${p.title}</h3>
        <p class="text-warning">⭐ ${p.rating.rate}</p>
        <div class="flex justify-between items-center">
          <span class="font-bold">৳ ${Math.round(p.price * USD_TO_BDT)}</span>
          <button class="btn btn-primary btn-sm add-to-cart">Add to cart</button>
        </div>
      </div>
    </div>`;
      })
      .join("") || "<p>No products found.</p>";


  /* ADD TO CART BUTTONS
     (Prottekta product card-er Add to Cart button-e event listener 
     jog kora hoyeche, jate button-e click korle product-ta cart-e jog hoy.)
     */
  const productCards = $("product-list").querySelectorAll(".product-card");

  productCards.forEach(function (card) {

    const addButton = card.querySelector(".add-to-cart");

    addButton.addEventListener("click", function () {

      const id = Number(card.dataset.id);

      addToCart(id);

    });

  });
}
/* CART LOGIC  */

function addToCart(id) {
  const p = products.find(function (x) {
    return x.id === id;
  });

  const item = cart.find(function (x) {
    return x.id === id;
  });

  if (item) {
    item.qty++;
  } else {
    cart.push({
      id: id,
      title: p.title,
      image: p.image,
      price: Math.round(p.price * USD_TO_BDT),
      qty: 1,
    });
  }

  updateCart();
}

function removeItem(id) {
  cart = cart.filter(function (x) {
    return x.id !== id;
  });

  updateCart();
}

function getTotals() {
  const subtotal = cart.reduce(function (sum, i) {
    return sum + i.price * i.qty;
  }, 0);

  const delivery = cart.length ? DELIVERY : 0;
  const shipping = cart.length ? SHIPPING : 0;
  const discount = subtotal * discountRate;

  return {
    subtotal,
    delivery,
    shipping,
    discount,
    total: subtotal + delivery + shipping - discount,
  };
}


/*RENDER CART*/

function updateCart() {

  $("cart-list").innerHTML = "";


  /* EMPTY CART */

  if (cart.length === 0) {
    $("cart-list").innerHTML = '<li class="py-2 opacity-60">Cart is empty</li>';
  }
  /*   DISPLAY CART PRODUCTS */

  cart.forEach(function (item) {

    const cartItem = document.createElement("li");

    cartItem.className = "flex items-center gap-2 py-2";

    cartItem.innerHTML = `
      <img src="${item.image}" class="w-12 h-12 object-contain bg-white rounded" />
      <div class="flex-1 min-w-0">
        <p class="line-clamp-1">${item.title}</p>
        <div class="join">
          <button class="btn btn-xs join-item cart-minus">−</button>
          <span class="btn btn-xs join-item pointer-events-none">${item.qty}</span>
          <button class="btn btn-xs join-item cart-plus">+</button>
        </div>
      </div>
      <span class="font-semibold">৳ ${item.price * item.qty}</span>
      <button class="btn btn-xs btn-error delete-btn">✕</button>
    `;

    $("cart-list").appendChild(cartItem);

    /*CART PLUS*/

    const cartPlus = cartItem.querySelector(".cart-plus");

    cartPlus.addEventListener("click", function () {

      item.qty++;

      updateCart();

    });


    /* CART MINUS */

    const cartMinus = cartItem.querySelector(".cart-minus");

    cartMinus.addEventListener("click", function () {

      if (item.qty > 1) {

        item.qty--;

        updateCart();

      } else {

        // quantity 0 removes the item
        removeItem(item.id);

      }

    });


    /* DELETE ITEM*/

    const deleteButton = cartItem.querySelector(".delete-btn");

    deleteButton.addEventListener("click", function () {

      removeItem(item.id);

    });

  });


  /* Update totals */

  const t = getTotals();

  $("subtotal").textContent = t.subtotal;
  $("delivery").textContent = t.delivery;
  $("shipping").textContent = t.shipping;
  $("discount").textContent = "-" + t.discount.toFixed(2);
  $("total").textContent = t.total.toFixed(2);
}


/* COUPON*/

function applyCoupon() {
  const code = $("coupon").value.trim().toUpperCase();

  if (COUPONS[code]) {
    discountRate = COUPONS[code];
    message(`Coupon ${code} applied`, true);
  } else {
    discountRate = 0;
    message("Invalid coupon");
  }

  updateCart();
}


/* BALANCE: BUY AND ADD MONEY*/

function buyNow() {
  const { total } = getTotals();

  if (!cart.length) return message("Your cart is empty");
  if (total > balance) return message("Not enough balance. Please add money.");

  balance -= total;
  cart = [];
  discountRate = 0;

  saveBalance();
  updateCart();
  message("Purchase successful!", true);
}

function addMoney() {
  const amount = Number($("money").value);

  if (amount <= 0) return message("Enter a valid amount");

  balance += amount;
  $("money").value = "";

  saveBalance();
  message(`৳ ${amount} added`, true);
}

function saveBalance() {
  $("balance").textContent = Math.round(balance * 100) / 100;
}


/* REVIEWS CAROUSEL (auto + manual)*/

const reviews = [
  {
    name: "Nusrat Jahan",
    comment: "Fast delivery and good quality.",
    rating: 5,
    date: "12 Sep 2026",
  },
  {
    name: "Rafiul Hasan",
    comment: "The coupon worked perfectly.",
    rating: 4,
    date: "28 Sep 2026",
  },
  {
    name: "Tasnim Akter",
    comment: "Great prices, easy to use site.",
    rating: 5,
    date: "02 Oct 2026",
  },
  {
    name: "Imran Chowdhury",
    comment: "Good product, packaging could be better.",
    rating: 3,
    date: "15 Oct 2026",
  },
];

let rv = 0;

function showReview() {
  const r = reviews[rv];

  $("rv-name").textContent = r.name;
  $("rv-stars").textContent = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
  $("rv-comment").textContent = r.comment;
  $("rv-date").textContent = r.date;
}

function moveReview(step) {
  rv = (rv + step + reviews.length) % reviews.length;
  showReview();
}


/* NAVBAR ACTIVE LINK*/

function updateActiveLink() {
  let current = "home";

  ["home", "products", "reviews", "contact"].forEach(function (id) {
    if ($(id).offsetTop <= window.scrollY + 120) current = id;
  });

  document.querySelectorAll("[data-link]").forEach(function (a) {
    a.classList.toggle("active", a.dataset.link === current);
  });
}

/* EVENT LISTENERS
   (product abong cart buttons  add kora hoyeche
   showProducts() and updateCart() er vhetore, right after rendering)*/

/* Coupon */

$("apply").addEventListener("click", function () {

  applyCoupon();

});

$("coupon").addEventListener("keydown", function (event) {

  if (event.key === "Enter") {
    applyCoupon();
  }

});


/* Buy and add money */

$("buy").addEventListener("click", function () {

  buyNow();

});

$("add-money").addEventListener("click", function () {

  addMoney();

});


/* Search */

$("search").addEventListener("input", function (event) {

  searchText = event.target.value.toLowerCase();

  showProducts();

});


/* Category */

$("category").addEventListener("change", function (event) {

  selectedCategory = event.target.value;

  showProducts();

});


/* Reviews */

$("rv-prev").addEventListener("click", function () {

  moveReview(-1);

});

$("rv-next").addEventListener("click", function () {

  moveReview(1);

});

setInterval(function () {

  moveReview(1);

}, 4000); // automatic sliding

/* Scroll */

window.addEventListener("scroll", function () {

  updateActiveLink();

});

/* Footer "Back to top" button */

const backToTop = $("back-to-top");

if (backToTop) {

  backToTop.addEventListener("click", function () {

    window.scrollTo({ top: 0, behavior: "smooth" });

  });

}

/* CONTACT FORM*/

const contactForm = document.getElementById("contactForm");
const successMessage = document.getElementById("successMessage");

contactForm.addEventListener("submit", function (event) {

  event.preventDefault(); // page ke reload howa theke stop kore

  successMessage.classList.remove("hidden");

  setTimeout(function () {
    successMessage.classList.add("hidden");
  }, 3000);

  contactForm.reset();

});

/*
   START
   */
saveBalance();
updateCart();
showReview();
updateActiveLink();
loadProducts();