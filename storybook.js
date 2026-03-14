window.addEventListener("load", function () {

  // Use this variable to hold the endpoint response for the current page
  let currentPageInfo;

  // Variable for total page count here so it can be accessed by multiple functions
  let totalPageCount;

  let isAnimating = false;

  // TODO: add click event listeners
  function turnLeftClick() {
    let pageLeft = document.querySelector("#page-left");
    let controlLeft = document.querySelector("#turn-left");
    pageLeft.addEventListener('click', previous_page);
    // Pasang di area kontrol (pinggiran cokelat)
    controlLeft.addEventListener('click', previous_page);
  }

  function turnRightClick() {
    let pageRight = document.querySelector("#page-right");
    let controlRight = document.querySelector("#turn-right"); // Tambahkan ini agar area pinggir juga fungsi
    
    // Pasang di area halaman
    pageRight.addEventListener('click', next_page);
    // Pasang di area kontrol (pinggiran cokelat)
    controlRight.addEventListener('click', next_page);
  }


  turnLeftClick();
  turnRightClick();
  initialisePage();

  async function initialisePage() {

    // TODO: Use a request to the first endpoint to get the information about the pages in the storybook
    // let response = await fetch(`https://story.trex-sandwich.com/`);
    let response = await fetch(`api/index.json`);
    // TODO: Get a JSON object from the response
    let pageJsonObject = await response.json();

    // TODO: Set the totalPageCount variable to the total number of pages in the endpoint
    totalPageCount = pageJsonObject.length;

    // TODO: Call the loadPage function and pass in the URL for the first page as a parameter
    await loadPage(pageJsonObject[0]);
  }

  async function loadPage(pageUrlToFetch) {
    // TODO: Use the fetch API to create a request to the story endpoint
    let response = await fetch(pageUrlToFetch);

    // TODO: Use the response.json() method to get a JSON Obj from the response and store the JSON in the global variable currentPageInfo
    // the currentPageInfo variable will be used by other functions
    currentPageInfo = await response.json();

    // TODO: Call the updatePageDisplay function
    updatePageDisplay();
  }

  function updatePageDisplay() {
    // TODO: Update the span element that displays the total page count to display the total page count
    document.querySelector("#total-page").innerText = totalPageCount;

    // TODO: Update the span element that displays the current page number to display the current page number
    document.querySelector("#current-page").innerText = currentPageInfo.page_number;

    // TODO: Update the div element for the right hand page div to display the content for the current page
    // Have a look at the structure of the data in the endpoint response to see the content property
    let rightPageDiv = document.querySelector("#page-right");
    rightPageDiv.innerHTML = currentPageInfo.content;

    // TODO: Create an image element, set the src attribute to the image property of the currentPageInfo JSONObject
    let imgElement = document.createElement("img");
    imgElement.src = currentPageInfo.image;
    // TODO: Remove any existing HTML elements from the left hand page div
    let leftPageDiv = document.querySelector("#page-left");
    leftPageDiv.innerHTML = "";
    // TODO: Append the image element to the left hand page div
    leftPageDiv.appendChild(imgElement);

  }

  // This function will control what happens then we want to load the previous page
  function previous_page() {
    if (currentPageInfo.previous_page) {
      animateAndLoad("prev");
    }
  }

  // This function will control what happens then we want to load the next page
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

});
