
const periodicRefreshPeriod = 10;
let categories = [];
let selectedCategory = "";
let SelectedKeyword = "";
let currentETag = "";
let hold_Periodic_Refresh = false;
let pageManager;
let itemLayout;
let waiting = null;

let waitingGifTrigger = 2000;
function addWaitingGif() {
    clearTimeout(waiting);
    waiting = setTimeout(() => {
        $("#itemsPanel").append($("<div id='waitingGif' class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
    }, waitingGifTrigger)
}
function removeWaitingGif() {
    clearTimeout(waiting);
    $("#waitingGif").remove();
}

Init_UI();

async function Init_UI() {
    itemLayout = {
        width: $("#sample").outerWidth(),
        height: $("#sample").outerHeight()
    };
    pageManager = new PageManager('scrollPanel', 'itemsPanel', itemLayout, renderNews);
    compileCategories();
    $('#createNews').on("click", async function () {
        renderCreateNewsForm();
    });
    $('#abort').on("click", async function () {
        showNews()
    });
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
    showNews();
    start_Periodic_Refresh();
}

function showNews() {
    $("#actionTitle").text("Les Nouvelles du Coin");
    $("#scrollPanel").show();
    $('#abort').hide();
    $('#NewsForm').hide();
    $('#aboutContainer').hide();
    $("#createNews").show();
    hold_Periodic_Refresh = false;
}
function hideNews() {
    $("#scrollPanel").hide();
    $("#createNews").hide();
    $("#abort").show();
    hold_Periodic_Refresh = true;
}
function start_Periodic_Refresh() {
    setInterval(async () => {
        if (!hold_Periodic_Refresh) {
            let etag = await News_API.HEAD();
            if (currentETag != etag) {
                currentETag = etag;
                await pageManager.update(false);
                compileCategories();
            }
        }
    },
        periodicRefreshPeriod * 1000);
}
function renderAbout() {
    hideNews();
    $("#actionTitle").text("À propos...");
    $("#aboutContainer").show();
}
async function renderNews(queryString) {
    
    let endOfData = false;
    queryString += "&sort=category";
    if (selectedCategory != "") queryString += "&category=" + selectedCategory;
    addWaitingGif();
    $("#itemsPanel").empty();
    let response = await News_API.Get(queryString);
    
    if (!News_API.error) {
        currentETag = response.ETag;
        let News = response.data;
        if (News.length > 0) {
            News.forEach(N => {
                $("#itemsPanel").append(renderNew(N));
            });
            $(".editCmd").off();
            $(".editCmd").on("click", function () {
                renderEditNewsForm($(this).attr("editNewsId"));
            });
            $(".deleteCmd").off();
            $(".deleteCmd").on("click", function () {
                renderDeleteNewsForm($(this).attr("deleteNewsId"));
            });
            $(".expandCmd").on("click", function () {
                renderNewsPage($(this).attr("expandsNewsId"));
            });
        } else
            endOfData = true;
    } else {
        renderError(News_API.currentHttpError);
    }
    removeWaitingGif();
    return endOfData;
}
 function convertToFrenchDate(numeric_date) {
    date = new Date(numeric_date);
    var options = { year: 'numeric', month: 'long', day: 'numeric' };
    var opt_weekday = { weekday: 'long' };
    var weekday = toTitleCase(date.toLocaleDateString("fr-FR", opt_weekday));

    function toTitleCase(str) {
        return str.replace(
            /\w\S*/g,
            function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        );
    }
    return weekday + " le " + date.toLocaleDateString("fr-FR", options) + " @ " + date.toLocaleTimeString("fr-FR");
}
function renderNew(news) {
    newsDate = convertToFrenchDate(news.Creation);
    return $(`
     <div class="NewsRow" id='${news.Id}'>
        <div class="NewsContainer noselect">
            <div class="NewsLayout">
                <div class="News">
                    <span class="NewsTitle">${news.Title}</span>
                    <div class="NewsImg" style="background-image:url('${news.Image}')"></div>
                    <span class="NewsDate">${newsDate}</span>
                    <div class= "NewsText">${news.Text}</div>
                </div>
                <span class="NewsCategory">${news.Category}</span>
            </div>
            <div class="NewsCommandPanel">
                <span class="editCmd cmdIcon fa fa-pencil" editNewsId="${news.Id}" title="Modifier ${news.Title}"></span>
                <span class="deleteCmd cmdIcon fa fa-trash" deleteNewsId="${news.Id}" title="Effacer ${news.Title}"></span>
                <span class="expandCmd cmdIcon fa fa-plus" expandsNewsId="${news.Id}" title="voir plus"></span>
            </div>
        </div>
    </div>           
    `);
}
async function renderNewsPage(newsId){
    let response = await News_API.Get(newsId)
    let news = response.data;
    newsDate = convertToFrenchDate(news.Creation);
    return $(`
        <div class="NewsRow" id='${news.Id}'>
           <div class="NewsContainer noselect">
                <div class="NewsCommandPanel">
                   <span class="editCmd cmdIcon fa fa-pencil" editNewsId="${news.Id}" title="Modifier ${news.Title}"></span>
                   <span class="deleteCmd cmdIcon fa fa-trash" deleteNewsId="${news.Id}" title="Effacer ${news.Title}"></span>
               </div>
               <div class="NewsLayout">
                   <div class="News">
                       <span class="NewsTitle">${news.Title}</span>
                       <div class="NewsImg" style="background-image:url('${news.Image}')"></div>
                       <span class="NewsDate">${newsDate}</span>
                   </div>
                   <span class="NewsCategory">${news.Category}</span>
                   
               </div>

           </div>
       </div>           
       `);
}
function newsNews() {
    news = {};
    news.Id = 0;
    news.Title = "";
    news.Text = "";
    news.Category = "";
    return news;
}
function renderCreateNewsForm() {
    renderNewsForm();
}
async function renderEditNewsForm(id) {
    addWaitingGif();
    let response = await News_API.Get(id)
    if (!News_API.error) {
        let news = response.data;
        if (news !== null)
            renderNewsForm(news);
        else
            renderError("Nouvelles introuvable!");
    } else {
        renderError(News_API.currentHttpError);
    }
    removeWaitingGif();
}
async function renderDeleteNewsForm(id) {
    hideNews();
    $("#actionTitle").text("Retrait");
    $('#NewsForm').show();
    $('#NewsForm').empty();
    let response = await News_API.Get(id)
    if (!News_API.error) {
        let News = response.data;
        if (News !== null) {
            $("#NewsForm").append(`
        <div class="NewsdeleteForm">
            <h4>Effacer la nouvelle suivante?</h4>
            <br>
            <div class="NewsRow" id=${News.Id}">
                <div class="NewsContainer noselect">
                    <div class="NewsLayout">
                        <div class="News">
                            <span class="NewsTitle">${News.Title}</span>
                        </div>
                        <span class="NewsCategory">${News.Category}</span>
                    </div>
                    <div class="NewsCommandPanel">
                        <span class="editCmd cmdIcon fa fa-pencil" editNewsId="${News.Id}" title="Modifier ${News.Title}"></span>
                        <span class="deleteCmd cmdIcon fa fa-trash" deleteNewsId="${News.Id}" title="Effacer ${News.Title}"></span>
                    </div>
                </div>
            </div>   
            <br>
            <input type="button" value="Effacer" id="deleteNews" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </div>    
        `);
            $('#deleteNews').on("click", async function () {
                await News_API.Delete(News.Id);
                if (!News_API.error) {
                    showNews();
                    await pageManager.update(false);
                    compileCategories();
                }
                else {
                    console.log(News_API.currentHttpError)
                    renderError("Une erreur est survenue!");
                }
            });
            $('#cancel').on("click", function () {
                showNews();
            });

        } else {
            renderError("Nouvelle introuvable!");
        }
    } else
        renderError(News_API.currentHttpError);
}


function renderNewsForm(news = null) {
    $("#createNews").hide();
    $("#abort").show();
    hideNews();
    let create = news == null;
    if (create) {
        news = newsNews();
        news.Image = "images/no-avatar.png";
    }
    $("#actionTitle").text(create ? "Création" : "Modification");
    $("#NewsForm").show();
    $("#NewsForm").empty();
    $("#NewsForm").append(`
        <form class="form" id="newsForm">
            
            <br>
            <input type="hidden" name="Id" value="${news.Id}"/>

            <label for="Title" class="form-label">Titre </label>
            <input 
                class="form-control Alpha"
                name="Title" 
                id="Title" 
                placeholder="Titre"
                required
                RequireMessage="Veuillez entrer un titre"
                InvalidMessage="Le titre comporte un caractère illégal"
                value="${news.Title}"
            />
            <label for="Text" class="form-label">Texte </label>
            <textarea name="Text" id="Text" class="form-control">${news.Text}</textarea>

            <label for="Category" class="form-label">Catégorie </label>
            <input 
                class="form-control"
                name="Category"
                id="Category"
                placeholder="Catégorie"
                required
                value="${news.Category}"
            />
            <label for="Image" class="form-label">Image</label>
            <div   class='imageUploader' newImage='${create}' controlId='Image' imageSrc='${news.Image}' waitingImage="Loading_icon.gif"> </div>
            <br>
            <input type="submit" value="Enregistrer" id="saveNews" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);
    initImageUploaders();
    initFormValidation(); 
    $('#newsForm').on("submit", async function (event) {
        event.preventDefault();
        let news = getFormData($("#newsForm"));

        news.Creation = Date.now();
     
        news = await News_API.Save(news, create);
        if (!News_API.error) {
            showNews();
            await pageManager.update(false);
            compileCategories();
            pageManager.scrollToElem(news.Id);
        }
        else
            renderError("Une erreur est survenue!");
    });
    $('#cancel').on("click", function () {
        showNews();
    });
}

function doSearch() {
    previousScrollPosition = 0;
    $("#content").scrollTop(0);
    offset = 0;
    endOfData = false;
    SelectedKeyword = $("#SearchMenu").val();
    renderNews(true);
}
function updateFilterMenu() {
    let CategoryMenu = $("#CategoryMenu");

    CategoryMenu.empty();
    if(selectedCategory != ""){
        CategoryMenu.append($(`
            <option value=${selectedCategory}>${selectedCategory}</option>
            `));
    }
    CategoryMenu.append($(`
        <option value="">Toutes les Catégories</option>
        `));
    categories.forEach(category => {
        if(category != selectedCategory){
            CategoryMenu.append($(`
                <option value="${category}">${category}</option>
            `));
        }
    })
    CategoryMenu.on("change", function () {

       
        selectedCategory = this.value;
        showNews();
        pageManager.reset();
    });
}
async function compileCategories() {
    categories = [];
    let response = await News_API.GetQuery("?fields=category&sort=category");
    if (!News_API.error) {
        let items = response.data;
        if (items != null) {
            items.forEach(item => {
                if (!categories.includes(item.Category))
                    categories.push(item.Category);
            })
            updateFilterMenu(categories);
        }
    }
}
function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}

function renderError(message) {
    hideNews();
    $("#actionTitle").text("Erreur du serveur...");
    $("#errorContainer").show(); 
    $("#errorContainer").append($(`<div>${message}</div>`));
}