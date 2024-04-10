async function loadModels() {
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/facial/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/facial/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/facial/models');
} 

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('referencePhoto').addEventListener('change', function() {
        displayPhotoPreview(this.files[0], 'referencePhotoPreview');
    });

    document.getElementById('photoList').addEventListener('change', function() {
        displayPhotoListPreview(this.files, 'photoListPreview');
    });

    document.getElementById('findMatches').addEventListener('click', async () => {
        // Placeholder for match-finding functionality with an alert message
        findMatches();
    });
}); 

function displayPhotoPreview(file, previewContainerId) {
    const previewContainer = document.getElementById(previewContainerId);
    previewContainer.innerHTML = '';
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.classList.add('img-thumbnail'); // Bootstrap class for styling images
            img.style.maxWidth = '200px';
            img.style.maxHeight = '200px';
            previewContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
    }
}

function displayPhotoListPreview(files, previewContainerId) {
    const previewContainer = document.getElementById(previewContainerId);
    previewContainer.innerHTML = ''; // Clear existing content
    previewContainer.classList.add('row', 'gx-2', 'gy-2'); // Use Bootstrap's grid system with spacing

    Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Create a column for each photo
            const colDiv = document.createElement('div');
            colDiv.classList.add('col-6', 'col-md-4', 'col-lg-3');

            // Create a photo container with a specific class for styling
            const photoContainer = document.createElement('div');
            photoContainer.classList.add('photo-container', 'text-center', 'p-2'); // Centered content with padding

            // Create an image element and set its source to the file reader result
            const img = document.createElement('img');
            img.src = e.target.result;
            img.classList.add('img-thumbnail', 'img-fluid'); // Bootstrap classes for styling
            img.style.maxHeight = '200px'; // Set a max height for the images to make them smaller
            img.style.width = 'auto'; // Ensure the width is automatically adjusted to maintain aspect ratio

            // Create a placeholder for the similarity score
            const scorePlaceholder = document.createElement('p');
            scorePlaceholder.id = `similarity-score-${index}`;
            scorePlaceholder.innerText = 'Similarity score:';

            // Append the image and score placeholder to the photo container
            photoContainer.appendChild(img);
            photoContainer.appendChild(scorePlaceholder);

            // Append the photo container to the column div
            colDiv.appendChild(photoContainer);

            // Append the column to the preview container
            previewContainer.appendChild(colDiv);
        };
        reader.readAsDataURL(file);
    });
}

// Placeholder function for finding matches
async function findMatches() {
    const referencePhotoInput = document.getElementById('referencePhoto');
    const photoListInput = document.getElementById('photoList');

    if (!referencePhotoInput.files[0]) {
        alert('Please upload a reference photo.');
        return;
    }
    if (photoListInput.files.length === 0) {
        alert('Please upload photos to compare.');
        return;
    }
    showLoader();
    // Load models
    await loadModels();

    const referencePhoto = await faceapi.bufferToImage(referencePhotoInput.files[0]);
    const referencePhotoDescriptor = await getDescriptor(referencePhoto);
    if (referencePhotoDescriptor == "") {
        console.log("fail");
        return;
    }

    const matches = [];

    for (let i = 0; i < photoListInput.files.length; i++) {
        console.log(`Processing photo ${i}`);
        const img = await faceapi.bufferToImage(photoListInput.files[i]);
        const descriptor = await getDescriptor(img);
        if (descriptor == "") {
            console.log("fail1");
            return;
        }
        const distance = faceapi.euclideanDistance(referencePhotoDescriptor, descriptor);
    
        updateSimilarityScore(i, distance);
    }

    // alert("complete compare");
    hideLoader();
    // displayMatches(matches);
}

function updateSimilarityScore(index, score) {
    const scoreElement = document.getElementById(`similarity-score-${index}`);
    if (scoreElement) {
        scoreElement.innerText = `Similarity score: ${((1 - score.toFixed(2)).toFixed(2) * 100).toFixed(2)}%`;
    } else {
        console.error(`Score element not found for index ${index}`);
    }
}

async function getDescriptor(img) {
    const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
    return detection ? detection.descriptor : "";
}

function displayMatches(matches) {
    const matchesContainer = document.getElementById('matches');
    matchesContainer.innerHTML = ''; // Clear previous results

    matches.forEach(match => {
        const imgElement = document.createElement('img');
        imgElement.src = match.img.src;
        imgElement.classList.add('img-thumbnail', 'me-2'); // Bootstrap classes for styling images
        imgElement.style.maxWidth = '100px';
        imgElement.style.maxHeight = '100px';
        imgElement.title = `Similarity score: ${match.distance}`;
        matchesContainer.appendChild(imgElement);
    });
    alert("complete compare");
}

function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

// Function to hide the loader
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}
