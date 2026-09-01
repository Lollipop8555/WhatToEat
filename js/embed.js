(function () {
    var isPlaying = false;
    var spinTimeout = null;
    var currentMode = "human";
    var foodPools = {};
    var currentFoodItem = null;

    var $food = $("#embedFood");
    var $start = $("#embedStart");
    var $recipe = $("#embedRecipe");
    var $link = $("#embedRecipeLink");

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
        $start.text("停");
        $recipe.prop("hidden", true);
        loadPool(currentMode, function (pool) {
            if (!pool.length) {
                $food.text("暂无数据");
                return;
            }
            (function tick() {
                $food.text(pickName(pool));
                spinTimeout = setTimeout(tick, 60);
            })();
        });
    }

    function stopSpin() {
        isPlaying = false;
        clearTimeout(spinTimeout);
        $start.text("换一个");
        loadPool(currentMode, function (pool) {
            if (!pool.length) return;
            var item = pool[Math.floor(Math.random() * pool.length)];
            currentFoodItem = item;
            var name = typeof item === "string" ? item : item.name;
            $food.text(name);
            if (typeof item === "object" && item.recipe) {
                $link.attr("href",
                    "recipe.html?name=" + encodeURIComponent(name) +
                    "&path=" + encodeURIComponent(item.recipe));
                $recipe.prop("hidden", false);
            } else {
                $recipe.prop("hidden", true);
            }
        });
    }

    $start.on("click", function () {
        if (isPlaying) stopSpin();
        else startSpin();
    });

    $("#embedModes").on("click", ".embed-mode", function () {
        $(this).addClass("selected").siblings().removeClass("selected");
        currentMode = $(this).data("type");
        currentFoodItem = null;
        $recipe.prop("hidden", true);
        if (isPlaying) {
            clearTimeout(spinTimeout);
            isPlaying = false;
        }
        $start.text("开始");
        $food.text("点开始，帮你决定！");
    });

    $food.text("点开始，帮你决定！");
})();
