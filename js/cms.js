document.addEventListener('DOMContentLoaded', function () {
    // Check if newsData exists
    if (typeof newsData === 'undefined') {
        alert("Error: newsData could not be loaded. Please ensure news-data.js is present.");
        return;
    }

    // Initialize Quill Editor
    var quill = new Quill('#editor-container', {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                ['blockquote'],
                [{ 'header': 3 }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link'],
                ['clean']
            ]
        }
    });

    const articleModal = new bootstrap.Modal(document.getElementById('articleModal'));
    const tableBody = document.getElementById('articlesTableBody');
    let currentEditId = null;
    let isDirty = false; // Tracks if there are unsaved changes

    // Warn user before refreshing if they have unsaved changes
    window.addEventListener('beforeunload', function (e) {
        if (isDirty) {
            e.preventDefault();
            e.returnValue = ''; // Required for modern browsers to show the warning
        }
    });

    // Render Table
    function renderTable() {
        tableBody.innerHTML = '';
        newsData.forEach(article => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <img src="${article.image}" alt="img" class="img-thumbnail" style="width: 60px; height: 60px; object-fit: cover;">
                </td>
                <td class="font-medium">${article.title}</td>
                <td><span class="badge bg-secondary">${article.category}</span></td>
                <td>${article.date}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editArticle('${article.id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteArticle('${article.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Process HTML to add custom classes
    function formatHTMLForSite(html) {
        // We add Haruna site's custom classes to standard HTML tags output by Quill
        let formatted = html;
        formatted = formatted.replace(/<p>/g, '<p class="mb-4">');
        formatted = formatted.replace(/<h3>/g, '<h3 class="h4 font-bold text-dark mb-3">');
        formatted = formatted.replace(/<blockquote>/g, '<blockquote class="border-l-4 border-brand-green ps-5 my-10 py-2"><p class="text-2xl font-bold italic text-dark">');
        formatted = formatted.replace(/<\/blockquote>/g, '</p></blockquote>');
        return formatted;
    }

    // Generate ID from Title
    function generateId(title) {
        return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    // Image File Picker Logic
    document.getElementById('articleImageFile').addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    // Compress image using canvas
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Get compressed Base64 string
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    
                    // Set hidden field and preview
                    document.getElementById('articleImageBase64').value = dataUrl;
                    document.getElementById('imagePreview').src = dataUrl;
                    document.getElementById('imagePreviewContainer').classList.remove('d-none');
                };
                img.src = event.target.result;
            }
            reader.readAsDataURL(file);
        }
    });

    // Global Edit Function
    window.editArticle = function (id) {
        const article = newsData.find(a => a.id === id);
        if (!article) return;

        currentEditId = id;
        document.getElementById('modalTitle').textContent = 'Edit Article';
        
        // Populate fields
        document.getElementById('articleTitle').value = article.title;
        document.getElementById('articleCategory').value = article.category;
        document.getElementById('articleDate').value = article.date;
        document.getElementById('articleSource').value = article.source || '';
        document.getElementById('articleReadTime').value = article.readTime || '';
        document.getElementById('articleImageBase64').value = article.image;
        document.getElementById('articleLead').value = article.lead;
        
        // Reset file picker
        document.getElementById('articleImageFile').value = '';
        
        // Show Image Preview from path
        if (article.image) {
            document.getElementById('imagePreview').src = article.image;
            document.getElementById('imagePreviewContainer').classList.remove('d-none');
        } else {
            document.getElementById('imagePreviewContainer').classList.add('d-none');
        }
        
        // Set Quill content. We try to un-format custom classes so editor looks clean
        let cleanHTML = article.content;
        cleanHTML = cleanHTML.replace(/class="[^"]*"/g, ''); // strip all classes for editor
        cleanHTML = cleanHTML.replace(/<blockquote[^>]*>\s*<p[^>]*>/g, '<blockquote>'); // remove inner p from blockquote
        cleanHTML = cleanHTML.replace(/<\/p>\s*<\/blockquote>/g, '</blockquote>');
        quill.clipboard.dangerouslyPasteHTML(cleanHTML);

        articleModal.show();
    };

    // Global Delete Function
    window.deleteArticle = function (id) {
        if (confirm("Are you sure you want to delete this article? This action is only saved when you click 'Save to File'.")) {
            const index = newsData.findIndex(a => a.id === id);
            if (index > -1) {
                newsData.splice(index, 1);
                isDirty = true;
                renderTable();
            }
        }
    };

    // Add New Button
    document.getElementById('btnAddNew').addEventListener('click', () => {
        currentEditId = null;
        document.getElementById('modalTitle').textContent = 'Add New Article';
        document.getElementById('articleForm').reset();
        
        // Hide image preview
        document.getElementById('imagePreview').src = '';
        document.getElementById('imagePreviewContainer').classList.add('d-none');
        
        quill.setContents([]);
        articleModal.show();
    });

    // Save Article (In Memory)
    document.getElementById('articleForm').addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent default form submission

        const title = document.getElementById('articleTitle').value;
        const category = document.getElementById('articleCategory').value;
        const date = document.getElementById('articleDate').value;
        const source = document.getElementById('articleSource').value;
        const readTime = document.getElementById('articleReadTime').value;
        const image = document.getElementById('articleImageBase64').value;
        const lead = document.getElementById('articleLead').value;
        const rawContent = quill.root.innerHTML;

        if (quill.getText().trim() === '') {
            alert('Please add some content to the article.');
            return;
        }

        const formattedContent = formatHTMLForSite(rawContent);

        const articleObj = {
            id: currentEditId ? currentEditId : generateId(title),
            title: title,
            category: category,
            date: date,
            image: image,
            lead: lead,
            content: formattedContent
        };

        if (source) articleObj.source = source;
        if (readTime) articleObj.readTime = readTime;

        if (currentEditId) {
            const index = newsData.findIndex(a => a.id === currentEditId);
            newsData[index] = articleObj;
        } else {
            // Check for duplicate ID
            if (newsData.some(a => a.id === articleObj.id)) {
                articleObj.id += '-' + Math.floor(Math.random() * 1000);
            }
            newsData.unshift(articleObj); // Add to top
        }

        isDirty = true; // Mark as having unsaved changes
        renderTable();
        articleModal.hide();
    });

    // Save to File using File System Access API or Fallback Download
    document.getElementById('btnSaveChanges').addEventListener('click', async () => {
        let fileContent = `const newsData = [\n`;
        newsData.forEach((item, index) => {
            fileContent += `    {\n`;
            fileContent += `        id: "${item.id}",\n`;
            fileContent += `        title: "${item.title.replace(/"/g, '\\"')}",\n`;
            fileContent += `        category: "${item.category}",\n`;
            fileContent += `        date: "${item.date}",\n`;
            if (item.source) fileContent += `        source: "${item.source.replace(/"/g, '\\"')}",\n`;
            if (item.readTime) fileContent += `        readTime: "${item.readTime}",\n`;
            fileContent += `        image: "${item.image}",\n`;
            fileContent += `        lead: "${item.lead.replace(/"/g, '\\"')}",\n`;
            
            // Safely escape backticks and interpolation
            let safeContent = item.content.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
            
            fileContent += `        content: \`\n            ${safeContent}\n        \`\n`;
            fileContent += `    }`;
            if (index < newsData.length - 1) {
                fileContent += `,`;
            }
            fileContent += `\n`;
        });
        fileContent += `];\n`;

        if (!window.showSaveFilePicker) {
            // Fallback for browsers that don't support File System Access API (like Firefox)
            const blob = new Blob([fileContent], { type: 'text/javascript' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'news-data.js';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert("Your browser does not support directly updating the file. The updated 'news-data.js' file has been downloaded instead. Please replace the old file in the 'js' folder with this new one.");
            return;
        }

        try {

            // Request save file picker
            const options = {
                suggestedName: 'news-data.js',
                types: [{
                    description: 'JavaScript File',
                    accept: { 'text/javascript': ['.js'] },
                }],
            };
            
            const handle = await window.showSaveFilePicker(options);
            const writable = await handle.createWritable();
            await writable.write(fileContent);
            await writable.close();
            
            isDirty = false; // Changes have been successfully saved
            alert('Success! news-data.js has been updated.');
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error(err);
                alert('An error occurred while saving: ' + err.message);
            }
        }
    });

    // Initial render
    renderTable();
});
