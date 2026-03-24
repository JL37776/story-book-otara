window.addEventListener("load", function () {

  let currentPageInfo;
  let totalPageCount;
  let isAnimating = false;


  function turnLeftClick() {
    let pageLeft = document.querySelector("#page-left");
    let controlLeft = document.querySelector("#turn-left");
    pageLeft.addEventListener('click', previous_page);
    controlLeft.addEventListener('click', previous_page);
  }

  function turnRightClick() {
    let pageRight = document.querySelector("#page-right");
    let controlRight = document.querySelector("#turn-right"); 

    pageRight.addEventListener('click', next_page);
    controlRight.addEventListener('click', next_page);
  }


  turnLeftClick();
  turnRightClick();
  initialisePage();

  async function initialisePage() {

    let response = await fetch(`api/index.json`);
    let pageJsonObject = await response.json();

    totalPageCount = pageJsonObject.length;

    await loadPage(pageJsonObject[0]);
  }

  async function loadPage(pageUrlToFetch) {
    let response = await fetch(pageUrlToFetch);

    currentPageInfo = await response.json();

    updatePageDisplay();
  }

  function updatePageDisplay() {
    document.querySelector("#total-page").innerText = totalPageCount;

    document.querySelector("#current-page").innerText = currentPageInfo.page_number;

     let rightPageDiv = document.querySelector("#page-right");
    rightPageDiv.innerHTML = currentPageInfo.content;

    let imgElement = document.createElement("img");
    imgElement.src = currentPageInfo.image;
    let leftPageDiv = document.querySelector("#page-left");
    leftPageDiv.innerHTML = "";
    leftPageDiv.appendChild(imgElement);

    updateCursor();

    // Notify sprite that the page has changed
    document.dispatchEvent(new CustomEvent("sprite:pageChanged", {
      detail: {
        pageNumber: currentPageInfo.page_number,
        totalPages: totalPageCount,
      }
    }));
  }

  function previous_page() {
    if (currentPageInfo.previous_page) {
      animateAndLoad("prev");
    }
  }

  function next_page() {
    if (currentPageInfo.next_page) {
      animateAndLoad("next");
    }
  }

  function animateAndLoad(direction) {
    if (isAnimating) return;

    const leftPage = document.querySelector("#page-left");
    const rightPage = document.querySelector("#page-right");

    if (direction === "next" && currentPageInfo.next_page) {
        isAnimating = true;
        rightPage.classList.add("page-flip-next");
        
        setTimeout(() => {
            loadPage(currentPageInfo.next_page);
        }, 400); 

        setTimeout(() => {
            rightPage.classList.remove("page-flip-next");
            isAnimating = false; // Reset flag
        }, 800);
        
    } else if (direction === "prev" && currentPageInfo.previous_page) {
        isAnimating = true;
        leftPage.classList.add("page-flip-prev");
        
        setTimeout(() => {
            loadPage(currentPageInfo.previous_page);
        }, 400);

        setTimeout(() => {
            leftPage.classList.remove("page-flip-prev");
            isAnimating = false; // Reset flag
        }, 800);
    }
}

function updateCursor() {
  const leftPage = document.querySelector("#page-left");
  const rightPage = document.querySelector("#page-right");

  const page = currentPageInfo.page_number;

  // Reset
  leftPage.style.cursor = "auto";
  rightPage.style.cursor = "auto";

  // Page 1 only right
  if (page === 1) {
    rightPage.style.cursor = "e-resize";
  }

  // last page only left
  else if (page === totalPageCount) {
    leftPage.style.cursor = "w-resize";
  }

  else {
    leftPage.style.cursor = "w-resize";
    rightPage.style.cursor = "e-resize";
  }
}

});
