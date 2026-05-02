$script = @"
    <script>
        window.addEventListener('scroll', function() {
            const navbar = document.querySelector('.navbar-custom');
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    </script>
</body>
"@

Get-ChildItem -Filter *.html | ForEach-Object {
    (Get-Content $_.FullName -Raw) -replace '</body>', $script | Set-Content $_.FullName
}

Get-ChildItem -Filter *.html | Where-Object { $_.Name -ne 'index.html' } | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace '<div class="bg-gray-50 py-16 border-b border-gray-200">', '<div class="page-header">'
    $content = $content -replace 'text-gray-900', 'text-white'
    $content = $content -replace 'text-gray-600', 'text-gray-300'
    Set-Content $_.FullName $content
}
