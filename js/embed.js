(function () {
    var isPlaying = false;
    var spinTimeout = null;
    var currentMode = "human";
    var foodPools = {};
    var currentFoodItem = null;

    var foodEl = document.getElementById("embedFood");
    var startEl = document.getElementById("embedStart");
    var recipeEl = document.getElementById("embedRecipe");
    var linkEl = document.getElementById("embedRecipeLink");
    var modesEl = document.getElementById("embedModes");

    function loadPool(mode, cb) {
        if (foodPools[mode]) {
            cb(foodPools[mode]);
            return;
        }
        fetch("./foodData/" + mode + ".json")
            .then(function (r) { return r.json(); })
            .then(function (data) {
                foodPools[mode] = data;
                cb(data);
            })
            .catch(function (e) {
                console.error("加载 " + mode + ".json 失败:", e);
                cb([]);
            });
    }

    function pickName(pool) {
        var item = pool[Math.floor(Math.random() * pool.length)];
        return typeof item === "string" ? item : item.name;
    }

    function startSpin() {
        isPlaying = true;
        startEl.textContent = "停";
        recipeEl.hidden = true;
        loadPool(currentMode, function (pool) {
            if (!pool.length) {
                foodEl.textContent = "暂无数据";
                return;
            }
            (function tick() {
                foodEl.textContent = pickName(pool);
                spinTimeout = setTimeout(tick, 60);
            })();
        });
    }

    function stopSpin() {
        isPlaying = false;
        clearTimeout(spinTimeout);
        startEl.textContent = "换一个";
        loadPool(currentMode, function (pool) {
            if (!pool.length) return;
            var item = pool[Math.floor(Math.random() * pool.length)];
            currentFoodItem = item;
            var name = typeof item === "string" ? item : item.name;
            foodEl.textContent = name;
            if (typeof item === "object" && item.recipe) {
                linkEl.href = "recipe.html?name=" + encodeURIComponent(name) +
                    "&path=" + encodeURIComponent(item.recipe);
                recipeEl.hidden = false;
            } else {
                recipeEl.hidden = true;
            }
        });
    }

    startEl.addEventListener("click", function () {
        if (isPlaying) stopSpin();
        else startSpin();
    });

    modesEl.addEventListener("click", function (e) {
        if (!e.target.classList || !e.target.classList.contains("embed-mode")) return;
        var mode = e.target.getAttribute("data-type");
        currentMode = mode;
        currentFoodItem = null;
        recipeEl.hidden = true;
        if (isPlaying) {
            clearTimeout(spinTimeout);
            isPlaying = false;
        }
        startEl.textContent = "开始";
        foodEl.textContent = "点开始，帮你决定！";
        var kids = modesEl.children;
        for (var i = 0; i < kids.length; i++) {
            kids[i].classList.toggle("selected", kids[i] === e.target);
        }
    });

    foodEl.textContent = "点开始，帮你决定！";
})();
