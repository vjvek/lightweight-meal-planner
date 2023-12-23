// Initial app setup
var latestId = 1;

$('textarea').on('input change', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

observerSelect2();
addNewIngr();

setTimeout(() => {
    ingrRow = $('#ingredients').clone().html(); // used to create new ingredients
}, 500);

updateApp();

setTimeout(() => {
    mealRow = $('.plan-list').clone().html(); // used to create new meals for the plan
}, 500);

setTimeout(() => {
    getPlan().then((plan) => {
        showPlan(plan);
        updatePlanList(plan);
    });
}, 500)

$('#editMeals').select2({ width: '100%' });

// handles disabling of the inputs in the create a meal section
var $initInputs = $('#editMeals, #mealName');
var $otherInputs = $('#createMealForm :input:not(#editMeals, #mealName, #dltIngrBtn)');

$initInputs.on('change', () => {
    const editMeal = $('#editMeals').val();
    const mealName = $('#mealName').val();
    if (editMeal || mealName) {
        $otherInputs.prop('disabled', false);
    }
    else {
        $otherInputs.prop('disabled', true);
    }
});


/**
 * Create a mutation observer that looks for select elements in specific DOM nodes.
 * When this is observed, apply `select2` to it. 
 */
function observerSelect2() {
    // create a mutation observer that watches #ingredients
    const targetNode1 = document.getElementById("ingredients");
    const targetNode2 = document.getElementById("createPlanForm");
    // options for the observer (which mutations to observe)
    const config = { childList: true, subtree: true };
    // callback function to execute when mutations are observed
    const callback = (mutationList, observer) => {
        for (const mutation of mutationList) {
            if (mutation.type === "childList" && mutation.addedNodes.length >= 1) {
                // apply select2 to the ingredients rows
                const $newNode = $(mutation.addedNodes[1])
                isNewIngr = $newNode.hasClass('ingr-row') || $newNode.hasClass('ingr-div');
                isNewPlan = $newNode.hasClass('plan-row');

                if (isNewIngr) {
                    setTimeout(() => {
                        $('.ingr-select').select2({ width: '100%' });
                    }, 500);
                }
                if (isNewPlan) {
                    setTimeout(() => {
                        $('.meal-name').select2({ width: '100%' });
                    }, 500);
                }
            }
        }
    };
    // create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);
    // start observing the target node for configured mutations
    observer.observe(targetNode1, config);
    observer.observe(targetNode2, config);
}


/**
 * AJAX request to get all the ingredients.
 * @returns {array} - Array of all the inrgedients
 */
function getIngredients() {
    return new Promise((resolve, reject) => {
        const request = $.ajax({
            type: "GET",
            url: "submit.php",
            datatype: 'json',
            data: {'type': 'ingredients'}
        });
        request.done((resp) => {
            resolve(JSON.parse(resp));
        });
        request.fail(() => {
            console.log("couldn't get the ingredients!")
        });
    });
}


/**
 * Creates the ingredient row that allows a user to save an ingredient against a meal.
 */
function addNewIngr() {
    var ingredients = '';
    getIngredients()
        .then((resp) => {
            const ingredientList = resp;
            var ingrSelect = `
                <select class="form-select ingr-select" name="ingredient" required>
                <option value="" disabled selected>Ingredient</option>
            `;
            ingredientList.forEach(ingr => {
                const option = `<option value="${ingr}">${ingr}</option>`;
                ingrSelect += option;
            });
            ingrSelect += '</select>';

        const html = `
            <div class="row d-flex align-items-center ingr-row mb-2">
                <div class="col-md-12 col-lg-auto">
                    <button type="button" class="btn-third dlt-ingr" title="Delete This Row" onclick="deleteIngredient(this)"><i class="bi bi-trash"></i></button>
                </div>
                <div class="col-sm-12 col-md-6 col-lg-3">
                    ${ingrSelect}
                </div>
                <div class="col-sm-12 col-md-3 col-lg-3">
                    <input type="number" class="form-control" name="quantity" min="0" placeholder="Quantity">
                </div>
                <div class="col-sm-12 col-md-3 col-lg-3">
                    <select name="unit" class="form-select">
                        <option value="" disabled selected>Unit</option>
                        <option value="g">Grams (g)</option>
                        <option value="ml">Millilitres (ml)</option> 
                        <option value="tsp">Teaspoon (tsp)</option>
                        <option value="tbsp">Tablespoon (tbsp)</option>
                        <option value="cups">Cups</option>
                        <option value="whole">Whole</option>
                        <option value="sprigs">Sprigs</option>
                        <option value="sticks">Sticks</option>
                    </select>
                </div>
            </div>`;
        ingredients += html;

        $('#ingredients').append(ingredients);
    });
}


/**
 * Creates the html for the ingredient divider.
 * @returns {string} div - string of the html for the divider input.
 */
function createIngrDiv() {
    const div = `
        <div class="row d-flex align-items-center ingr-div">
            <div class="col-auto">
                <button type="button" class="btn-third dlt-ingr" title="Delete This Row" onclick="deleteIngredient(this)"><i class="bi bi-trash"></i></button>
            </div>
            <div class="col-sm-12 col-md-6 col-lg-9">
                <input type="text" class="form-control" name="ingrDiv" placeholder="Splits ingredients into sections with some text eg. these ingredients are for the pie filling:">
            </div>
        </div>
    `;
    return div;
}


/**
 * Adds the ingredient divider html to the DOM.
 */
function addIngrDiv() {
    $('#ingredients').append(createIngrDiv());
}


/**
 * Allows a user to delete ingredients and their dividers.
 */
function deleteIngredient(btn) {
    const $ingrRow = $(btn);
    $ingrRow.closest('.row').remove();
}


/**
 * AJAX GET request to get all meals or a specific one via the id.
 * @param {string} type - Determines type of get request. Should be 'all_meals' or 'a_meal'
 * @param {number} id - Id of the meal when a single meal is requested
 * @returns {array} - Array of the meal(s).
 */
function getMeals(type, id) {
    return new Promise((resolve, reject) => {
        const request = $.ajax({
            type: "GET",
            url: "submit.php",
            datatype: 'json',
            data: {'type': type, 'id': id}
        });
        request.done((resp) => {
            resolve(JSON.parse(resp));
        });
        request.fail(() => {
            console.log('get request failed!');
        });
    });
}

/**
 * AJAX POST request to send a meal back to the server.
 * @param {Object} meal - A dictionary of the meal to be POSTed
 * @param {string} mode - Takes in 1 of 3 values:
 * 1. `create` - Tells the server the meal being POSTed is a new one
 * 2. `update` - An existing meal is being udpated
 * 3. `delete` - Delete this meal
 */
function postMeal(meal, mode) {
    const request = $.ajax({
        type: "POST",
        url: "submit.php",
        datatype: 'json',
        data: {
            'payload': JSON.stringify(meal),
            'mode': mode
        }
    });
    request.done((resp) => {
        const meals = JSON.parse(resp);
        updateMaxId(meals);
        updateApp();
        resetForm();
    });
    request.fail(() => {
        console.log('failed to post meal');  
    });
}


/**
 * Takes values in the create/edit a meal form and puts it into a dictionary.
 * This can then be POSTed back to the server.
 * @returns {Object} meal - Dictionary containing the meal details
 */
function mealToDict() {
    const $formData = $('#createMealForm');
    const id = $('#mealId').val();
    const meal = {};
    const dictMeal = {
        "name": $formData.find('#mealName').val(),
        "region": $formData.find('#region').val(),
        "course": $formData.find('#course').val(),
        "serv": $formData.find('#serving').val(),
        "time": {
            "len": $formData.find('#totalTime').val(),
            "unit": $formData.find('#timeUnit').val()
        },
        "desc": $formData.find('#description').val(),
    };
    const $ingrRows = $formData.find('#ingredients .row');
    // create the ingredients
    var ingredients = [];    
    $ingrRows.each(function() {
        const $ingr = $(this);
        // handles ingredients
        if ($ingr.hasClass('ingr-row')) {
            const $name = $ingr.find('select[name="ingredient"]').val();
            const $quantity = $ingr.find('input[name="quantity"]').val();
            const $unit = $ingr.find('select[name="unit"]').val();

            var ingredient = {}
            
            if ($name) {
                ingredient['name'] = $name;
                if ($quantity && $unit) {
                    ingredient['quant'] = $quantity;
                    ingredient['unit'] = $unit;
                }
            }
            // don't save rows with no ingredient name
            if (Object.keys(ingredient).length) {
                ingredients.push(ingredient);
            }
        }
        // handles dividers
        else if ($ingr.hasClass('ingr-div')) {
            var ingrDiv = $ingr.find('input[name="ingrDiv"]').val()
            if (ingrDiv) {
                var divText = {
                    'div': ingrDiv
                }
                ingredients.push(divText);
            }
        }     
    });

    dictMeal["ingrs"] = ingredients;
    meal[id] = dictMeal;

    return meal;
}


// saves a meal
function saveMeal() {
    const meal = mealToDict();
    postMeal(meal, 'create');
}


// updates an existing meal
function updateMeal() {
    const meal = mealToDict();
    postMeal(meal, 'update');
}


// deletes a meal
function deleteMeal() {
    const meal = mealToDict();
    postMeal(meal, 'delete');
}


/**
 * Updates the max id which is used to create a new meal. 
 * This ensures ids are always unique client side
 * @param {array} meals - Array of the meals which is used to calculate the max id 
 */
function updateMaxId(meals) {
    if (meals) {
        // get an array of the ids
        var ids = [];
        meals.forEach(meal => {
            for (const id in meal) {
                ids.push(id);
            }
        });
        // convert the ids to ints and gets the max
        const maxId = Math.max(...ids);
        latestId = maxId + 1;
        $('#mealId').val(latestId);
    }
    else {
        $('#mealId').val(1);
    }
}


/**
 * Is called when the app loads or after a meal is POSTed
 * 1. Max ID is incremented
 * 2. Datatable gets updated
 * 3. Edit meal select gets updated
 */
function updateApp() {
    getMeals('all_meals')
    .then((resp) => {
        updateMaxId(resp);
        updateTable(resp);
        updateMealList(resp);
    });
}


/**
 * Handles the maths to calulate the new ingredient quantities. This is down by comparing the
 * quantities set in the hidden ingredients which represent the original serving size and the
 * shown ingredients which represent the user adjusted serving size.
 */
function updateIngrQuantity() {
    const $ingredientsHidden = $('#detailIngredients li.ingr-hidden:has(span.meal-view-quantity)');
    const $ingredientsShown = $('#detailIngredients li.ingr-shown:has(span.meal-view-quantity)');
    const ogServingSize = parseInt($('#ogServingSize').text());
    const newServingSize = parseInt($('#servingInpt').val());
    // this is used to calculate the new quantities
    const percentChange = newServingSize / ogServingSize;
    
    $ingredientsHidden.each( (index, ingr) => {
        const $ingr = $(ingr);
        const $quantityHidden = $ingr.find('.meal-view-quantity');
        // calculate the new quantity
        const quantityVal = parseFloat($quantityHidden.text());
        var newQuantity = Math.round(quantityVal * percentChange * 10) / 10;
        // get the visible quantity value
        const $quantityShown = $ingredientsShown.find('.meal-view-quantity').eq(index);
        // makes the quantity a whole number if the decimal value on the float is 0 or it's larger than 50
        if (newQuantity % 1 == 0 || newQuantity > 50) {
            newQuantity = Math.round(newQuantity);
        }
        $quantityShown.text(newQuantity);
    });
}


/**
 * Populates the options for the meal selects
 * @param {array} meals - array of the meals 
 */
function updateMealList(meals) {
    var options = '';
    // arrange the meals alphabetically
    meals = meals.sort((a, b) => {
        const id1 = Object.keys(a)[0];
        const id2 = Object.keys(b)[0];

        return a[id1]['name'].localeCompare(b[id2]['name']);
    });

    meals.forEach(meal => {
        const id = Object.keys(meal)[0];
        options += `<option value="${id}">${meal[id]['name']}</option>`;
    });
    // remove all the options and set the updated ones
    $('#editMeals option:enabled').remove();
    $('#editMeals').append(options);
    // do the same for the meal plan forms
    $('#createPlanForm .meal-name').each(function() {
        const $mealSelect = $(this);
        const val = $mealSelect.val();
        $mealSelect.find('option:enabled').remove();
        $mealSelect.append(options);
        $mealSelect.val(val).trigger('change');
    });
}


/**
 * Gets a value from the meal object.
 * @param {Object} meal - A dictionary of a single meal
 * @param {string} key -A top level key that will be used with the meal to get a value
 * @param {string} [timeKey] - Optional. If `key` is `time` then another key is needed to get the nested value
 * @returns {string} - Returns the value requested using the supplied key(s)
 */
function getVal(meal, key, timeKey) {
    if (meal && key && timeKey) {
        if (meal.hasOwnProperty(key) && meal[key].hasOwnProperty(timeKey)) {
            return meal[key][timeKey];
        }
    }
    else {
        return meal[key];
    }
}


/**
 * Gets a meal and populates the form with the data so that it can be edited.
 * 1. Uses the data from the get request to populate the create a meal form
 * 2. For each ingredient and divider an appropriate row is created
 * 3. The buttons are changed 
 */
function editMeal() {
    const id = $('#editMeals option:selected').val();
    if (id) {
        getMeals('a_meal', id)
            .then((meals) => {
                // set the values into the form
                const meal = meals[id];
                $('#mealId').val(id);
                $('#mealName').val(meal['name']);
                $('#region').val(getVal(meal, 'region'));
                $('#course').val(getVal(meal, 'course'));
                $('#serving').val(getVal(meal, 'serv'));
                $('#totalTime').val(getVal(meal, 'time', 'len'));
                $('#timeUnit').val(getVal(meal, 'time', 'unit'));
                $('#description').val(getVal(meal, 'desc'));
                $('#description').trigger('change');
                // empty the ingredients and build the html for the ingredients
                var $ingredients = $('#ingredients');
                $ingredients.empty();
                var html = '';                
                
                const ingrs = meal['ingrs'];
                if (!ingrs.length) {    // if there aren't any ingredients just show an empty row
                    html += ingrRow;
                }
                else {
                    ingrs.forEach( (ingr) => {
                        if (ingr.hasOwnProperty('name')) {  // ingredient row
                            html += ingrRow;
                        }
                        else if (ingr.hasOwnProperty('div')) {  // divider row
                            html += createIngrDiv();
                        }
                    });
                }
                
                $ingredients.append(html);
                // set the values for each row
                if (ingrs.length) {
                    $ingredients.find('div[class*="ingr-"]').each(function(index, row) {
                        var ingr = ingrs[index];
                        if ($(row).hasClass('ingr-row')) {  // ingredient row
                            $(row).find('select[name="ingredient"]').val(ingr['name']).trigger('change');
                            $(row).find('input[name="quantity"]').val(ingr['quant']);
                            $(row).find('select[name="unit"]').val(ingr['unit']);
                        }
                        else if ($(row).hasClass('ingr-div')) { // ingredient div
                            $(row).find('input[name="ingrDiv"]').val(ingr['div']);
                        }
                    });
                }
                $('#saveMealBtn').hide();
                $('#resetFormBtn').prop('disabled', false);
                $('#updateMealBtn, #deleteMealBtn').show();
            });
    }
}


/**
 * Handles the drag and drop sorting functionality with the ingredients
 * using the Sortable.js library
 */
const el = document.getElementById('ingredients');
var sortable = Sortable.create(el);
sortable.option('disabled', true);


function enableSortMode() {
    $('#enableSortBtn').hide();
    $('#disableSortBtn').show();
    sortable.option('disabled', false);
    $('div[class*=ingr-]').addClass('sort-enabled');
}


function disableSortMode() {
    $('#disableSortBtn').hide();
    $('#enableSortBtn').show();
    sortable.option('disabled', true);
    $('div[class*=ingr-]').removeClass('sort-enabled');
}


/**
 * Resets the create/edit meal form and updates the max meal id for use with the next meal.
 */
function resetForm() {
    $('#createMealForm')[0].reset();
    $('#ingredients').html(ingrRow);
    $('#editMeals').val($('#editMeals option:first').val()).trigger('change');
    $('#description').trigger('change');
    $('#saveMealBtn').show();
    $('#resetFormBtn').prop('disabled', true);
    $('#updateMealBtn, #deleteMealBtn').hide();
    disableSortMode();
    
    getMeals('all_meals')
        .then((resp) => {
            updateMaxId(resp);
        });
}

/* Create Meal Plan Section ------------------- */ 

// handle inputs



// set the min date to today
var today = new Date;
today = today.toISOString().split('T', 10)[0];
$('#createPlanForm input[type="date"]').attr('min', today);


function planToJson() {
    const $formData = $('#createPlanForm');
    const $mealRows = $formData.find('.plan-row');
    const plan = [];

    $mealRows.each(function() {
        const $this = $(this);
        var mealId = $this.find('.meal-name').val();
        var mealName = $this.find('.meal-name').find(':selected').text();
        if (!mealId) {
            mealId = '';
            mealName = '';
        }
        const dictPlan = {
            'date': $this.find('.meal-date').val(),
            'meal_id': mealId,
            'meal_name': mealName,
            'meal_type': $this.find('.meal-type').val(),
            'serv': $this.find('.meal-serving').val(),
            'note': $this.find('.meal-note').val()
        };
        plan.push(dictPlan);
    });

    return plan;
}


function addNewMealRow() {
    $('.plan-list').append(mealRow);
}


function savePlan() {
    const plan = planToJson();
    postPlan(plan);
    updatePlanList(plan);
}


function postPlan(plan) {
    const request = $.ajax({
        type: "POST",
        url: "submit.php",
        datatype: 'json',
        data: {
            'payload': JSON.stringify(plan),
            'mode': 'plan'
        }
    });
    request.done(() => {
        var $saveBtn = $('#savePlanBtn');
        $saveBtn.text('Saved!');
        setTimeout(() => {
            $saveBtn.text('Save Plan');
        }, 2000);
    });
    request.fail(() => {
        console.log('failed to post plan!');
    });
}


function getPlan() {
    return new Promise((resolve, reject) => {
        const request = $.ajax({
            type: "GET",
            url: "submit.php",
            datatype: 'json',
            data: {'type': 'plan'},
        });
        request.done((resp) => {
            resolve(JSON.parse(resp));
        });
        request.fail(() => {
            console.log('get request failed!');
        });
    });
}


function showPlan(plan) {
        // iterate through length of plan and create rows for each one
    var $planDiv = $('.plan-list');
    $planDiv.empty();
    plan.forEach((plan) => {
        $planDiv.append(mealRow);
        const $newRow = $('.plan-row').last();
        $newRow.find('.meal-date').val(plan['date']);
        $newRow.find('.meal-name').val(plan['meal_id']).trigger('change');
        $newRow.find('.meal-type').val(plan['meal_type']);
        $newRow.find('.meal-serving').val(plan['serv']);
        $newRow.find('textarea').val(plan['note']);
    });
    $('.meal-name').select2({ width: '100%' });
}


function deletePlan(btn) {
    const $planRow = $(btn).closest('.plan-row');
    $planRow.remove();
}

/* My Meal Plan Section ----------------------- */

function updatePlanList(plan) {
    const $plan = $('#mealPlannerList');
    $plan.empty();
    plan.sort((a, b) => new Date(a['date']) - new Date(b['date']));
    plan.sort((a, b) => {
        const rating = {
            'breakfast': 1,
            'brunch': 2,
            'lunch': 3,
            'linner': 4,
            'dinner': 5,
        }
        return rating[a['meal_type']] - rating[b['meal_type']];         
    });
    const dates = [...new Set(plan.map(meal => meal['date']))];
    
    var html = '';
    dates.forEach((date) => {
        const dailyPlan = plan.filter(meal => meal['date'] === date);
        var cards = '';
        dailyPlan.forEach((meal) => {
            var id = '';
            var cardClass = '';
            var serving = '';
            if (meal['meal_name']) {
                id = `id="card-${meal['meal_id']}"`;
                cardClass = 'saved-meal'
            }
            const name = meal['meal_name'] || 'See notes';
            const note = meal['note'] || 'This meal has no notes';
            if (meal['serv']) {
                serving = `for ${meal['serv']}`; 
            }
            cards += `                    
                <div class="col-sm-12 col-md-4 col-lg-3">
                    <div ${id} class="card mb-2">
                        <div class="card-header ${cardClass}">
                            <h5 class="card-title">${name}</h5>
                        </div>
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-body-secondary font-small">${meal['meal_type']} ${serving}</h6>
                            <p class="card-text">${note}</p>
                        </div>
                    </div>
                </div>
            `;
        });

        
        
        const mealsInDay = `
            <div class="row mb-3">
                <h5 class="mb-3">${formatDate(date)}</h5>
                ${cards}                        
            </div>
        `;
        
        html += mealsInDay;
    });
    $plan.html(html);

    JumptoMeal();
}


function formatDate(dateString) {
    const date = new Date(dateString);
    const formattedDate = Intl.DateTimeFormat('en-GB', {
        dateStyle: 'full'
    }).format(date);
    
    return formattedDate;
}


function JumptoMeal() {
    $('.card[id]').each(function() {
        const $card = $(this);
        const cardId = $card.attr('id');
        const id = `#dt-${cardId.split('-').slice(-1)}`;
        const mealName = $card.find('.card-title').text();
        $card.on('click', () => {
            table.search( mealName ).draw();
            $(id).click();
            jumpToMealViewer();
            $('html, body').scrollTop($('#detailHeading').offset().top);
        }); 
    });
}

// get all the meals
// get plan
// order by date
// order by meal type
// show the plan
// for the shopping list
// filter out the meals with meal type 
// iterate through and get all the ingredients
// get all the distinct ingredients and sum the quantities where the units are the same
// multiply by serving size 
// show as shopping list


/* My Meals Section --------------------------- */ 


/**
 * Takes in a string and returns an emoji based on whether or not the string is empty.
 * @param {string} val - a string that is either empty or it isn't 
 * @returns {string} emoji - an icon based on if the val was true or false
 */
function prettyBool(val) {
    if (val) {
        return '✔️';
    }
    else {
        return '❌';
    }
}


// create the Datatable
var table = $('#mealsTable').DataTable({
    columnDefs: [
        { className: 'text-center', targets: [3, 4, 8]},
        { target: 0, visible: false },
        { target: 2, visible: false },
        { target: 5, visible: false },
        { target: 6, visible: false },
        { target: 7, visible: false },
    ],
    createdRow: function(row, data, index) {    // attached ids to each row using the meal id
        var id = `dt-${data[0]}`
        $(row).attr('id', id);
    },
    order: [[1, 'asc']], // order by name
    select: true
});


/**
 * Redraws the datatable using the latest array of meals. Hidden columns are included in the
 * table which are then used to show a meal's details when a row is clicked on.
 * @param {array} meals - Array of all the meals 
 */
function updateTable(meals) {
    table
        .clear()
        .draw();
      
    var mealRows = [];
    
    meals.forEach(meal => {
        const id = Object.keys(meal)[0];
        var ingredients = '';
        // build the ingredients
        var ingrs = meal[id]['ingrs'];
        var ingrCount = ingrs.length;
        
        if (ingrCount) {
            // builds the html for the ingredients and dividers
            ingrs.forEach((ingr, index) => {
                var isIngr = ingr.hasOwnProperty('name');
                if (index === 0) {
                    if (isIngr) {
                        ingredients += '<ul>';
                    }
                }
                if (index !== 0) {
                    if (ingrs[index-1].hasOwnProperty('div') && isIngr) {    // if the previous ingr was a div and this is a ingr
                        ingredients += '<ul>';
                    }
                    else if (ingrs[index-1].hasOwnProperty('name') && !isIngr) { // if the previous ingr was a ingr and this is a div
                        ingredients += '</ul>';
                    }
                }                    
                if (isIngr) {
                    var quantity = '';
                    if (ingr['quant']) {
                        var quantity = `<strong><span class="meal-view-quantity">${ingr['quant']}</strong> (${ingr['unit']})</span>`;
                    }
                    ingredients += `
                        <li class="ingr-shown">${ingr['name']} <strong>${quantity}</strong></li>
                        <li class="ingr-hidden" hidden>${ingr['name']} <strong>${quantity}</strong></li>
                    `;
                }
                else {
                    ingredients += `<p class="ingr-div"><strong>${ingr['div']}</strong></p>`;
                }
            });
        }
        else {
            ingredients += "<p>This meal doesn't have any ingredients so go add some MUPPET<p>";
        }
        // build the description
        if (meal[id]['desc']) {
            var desc = meal[id]['desc']
        }
        else {
            var desc = "This meal doesn't have a description so go add one MUPPET";
        }
        const description = `<h5>Instructions</h5><p>${desc}</p>`;
        // build the meal time
        if (meal[id]['time']['len']) {
            var time = `${meal[id]['time']['len']} ${meal[id]['time']['unit']}`;
        }
        else {
            var time = '-';
        }
        // The contents for each row in the table
        const mealRow = [
            id,
            meal[id]['name'],
            meal[id]['region'],
            prettyBool(meal[id]['desc']),
            prettyBool(meal[id]['ingrs'].length),
            ingredients,
            description,
            meal[id]['serv'],
            time
        ]
        mealRows.push(mealRow);
    });
    
    table.rows.add(mealRows).draw();
    
    // when a row in the table is clicked show the meal details
    $('#mealsTable').on('click', 'tbody tr', function() {
        const data = table.row(this).data();
        id = data[0]; // used in the jumptToEdit function
        const name = data[1];
        const serving = data[7];
        const ingredients = data[5];
        const hasQuantities = $(ingredients).find('.meal-view-quantity').length;
        var servingHtml = '<p class="font-small">There is no serving size saved for this meal.</p>';
        var servingInpt = '';
        if (serving) {
            servingHtml = `<p class="font-small">Original Serving Size (<span id="ogServingSize">${data[7]}</span>)</p>`;
        }
        
        if (serving && hasQuantities) {
            servingInpt = `
            <label for="servingInpt" class="form-label">Change Serving Size</label>
            <input id="servingInpt" type="number" class="form-control" min="1" value="${serving}" placeholder="Serving" onchange="updateIngrQuantity()"></input>
            `;
        }
        
        const header = `<h3>${name}</h3>${servingHtml}` + servingInpt;
        const btns = `
            <button id="copyBtn" type="button" class="btn-main me-3" onclick="mealToClipboard()"><i class="bi bi-copy"></i></button>
            <button type="button" class="btn-second" onclick="jumpToEdit()"><i class="bi bi-pencil-fill"></i></button>
        `;
        const description = data[6];
        const mealSubHeader = `
            <div class="col">
                <h5>Ingredients</h5>
            </div>
            <div class="col-auto"><p>⏰ ${data[8]}</p></div>`;
            
        $('#detailHeading').html(header);
        $('#mealToClipboard').html(btns);
        $('#mealSubHeader').html(mealSubHeader);
        $('#detailIngredients').html(ingredients);
        $('#detailDescription').html(description);
    });
}


/**
 * Copies a meals details to the clip board. The method used is dependant
 * on how the application has been hosted ie. if the domain has an SSL certificate.
 */
function mealToClipboard() {    
    // build the text to copy to the clipboard
    var textToCopy = '';
    const name = $('#detailHeading h3').text();
    const serving = $('#servingInpt').val();
    textToCopy += `${name}\n\nServing Size: ${serving}`;
    const mealTime = $('#mealTime').text();
    textToCopy += `\n${mealTime}`;
    // include the ingredients and description
    const ingrs = $('#detailIngredients').find('li.ingr-shown, p');
    if (ingrs.length) {
        textToCopy += '\n\n';
        ingrs.each(function() {
            textToCopy += $(this).text() + '\n';
        });
    }
    const description = $('#detailDescription p').text();
    textToCopy += '\n\n' + description;
    // copy the text into a hidden textarea and add it to the clipboard using deprecated method
    if (window.location.protocol == 'http:') {
        const clipboardInput = $('<textarea>');
        $('#detailDescription').after(clipboardInput);
        
        clipboardInput.val(textToCopy).select();
        document.execCommand("copy");
        clipboardInput.remove();
    }
    // use the recomended api if the app is using a SSL certificate
    else {
        const clipboardText = async () => {
            try {
                await navigator.clipboard.writeText(newClip);
            }
            catch(err) {
                alert('Failed to copy to clipboard. This browser may not support the API being used.\n\n', err)
            }
        }
    }
    // handles the copy button interaction
    const checkIcon = '<i class="bi bi-check2"></i>';
    const copyIcon = '<i class="bi bi-copy"></i>';
    const $copyBtn = $('#copyBtn');
    $copyBtn.html(checkIcon);
    
    setTimeout(() => {
        $copyBtn.html(copyIcon);
    }, 1500);
}


// Handles the logic for the edit meal button in the my meals section
const triggerTabList = document.querySelectorAll('#navbar a')
triggerTabList.forEach(triggerEl => {
    const tabTrigger = new bootstrap.Tab(triggerEl);

    triggerEl.addEventListener('click', event => {
        event.preventDefault();
        tabTrigger.show();
    });
});


/**
 * Jumps to the create/edit meal tab and shows you the meal you want to edit
 */
function jumpToEdit() {
    const triggerEl = document.querySelector('#navbar a[href="#createMealTab"]');
    bootstrap.Tab.getInstance(triggerEl).show();

    $('#editMeals').val(id);
    $('#editMeals').trigger('change');
}


function jumpToMealViewer() {
    const triggerEl = document.querySelector('#navbar a[href="#mealViewerTab"]');
    bootstrap.Tab.getInstance(triggerEl).show();
}