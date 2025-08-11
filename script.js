document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    const SHEET_ID = '1dvK3H3O4muMGV7NDVsXMYz0Syovo5Af2ddfKfbFmAgg';
    const SHEET_NAME = 'Sheet1';

    const searchTSBtn = document.getElementById('searchTSBtn');
    const searchInput = document.getElementById('searchInput');
    const noResults = document.getElementById('noResults');
    const resultsTable = document.getElementById('resultsTable');
    const loadingOverlay = document.getElementById('loadingOverlay');

    searchTSBtn.addEventListener('click', function () {
        searchByPartNumber(searchInput.value.trim());
    });

    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            searchByPartNumber(searchInput.value.trim());
        }
    });

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        const existingError = document.querySelector('.error-message');
        if (existingError) existingError.remove();
        searchInput.parentNode.insertBefore(errorDiv, searchInput.nextSibling);
        setTimeout(() => {
            errorDiv.style.opacity = '0';
            setTimeout(() => { errorDiv.remove(); }, 300);
        }, 3000);
    }

    function searchByPartNumber(partNumber) {
        if (!partNumber) {
            showError('Please enter a part number');
            return;
        }

        showLoading(true);

        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;
        fetch(url)
            .then(response => response.text())
            .then(csvData => {
                const rows = csvData.split(/\r?\n/);
                const headers = rows[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());

                const partIndex = headers.findIndex(h => h === 'unique code');
                const toolIndex = headers.findIndex(h => h === 'tool to use');
                const locationIndex = headers.findIndex(h => h === 'location');
                const dateIndex = headers.findIndex(h => h === 'tool manufacturing date');
                const customerIndex = headers.findIndex(h => h === 'customer name');
                const remarksIndex = headers.findIndex(h => h === 'remarks');

                if (partIndex === -1 || toolIndex === -1) {
                    showError('Required columns not found.');
                    showLoading(false);
                    return;
                }

                let found = false;
                for (let i = 1; i < rows.length; i++) {
                    const rowData = parseCSVRow(rows[i]);
                    const sheetPart = rowData[partIndex]?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                    const searchPart = partNumber.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

                    if (sheetPart === searchPart) {
                        found = true;
                        const tools = rowData[toolIndex]
                            ?.split(',')
                            .map(t => t.trim())
                            .filter(t => t);
                        displayPartResults(tools, rowData[locationIndex], rowData[dateIndex], rowData[customerIndex], rowData[remarksIndex]);
                        break;
                    }
                }

                if (!found) showNoResults();
                showLoading(false);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                showError('Failed to search.');
                showLoading(false);
            });
    }

    function displayPartResults(tools, location, date, customer, remarks) {
        noResults.style.display = 'none';
        resultsTable.style.display = 'block';
        resultsTable.innerHTML = '';

        tools.forEach((tool, index) => {
            addTableRow(`Tool ${index + 1}`, tool);
        });
        addTableRow('Location', location || 'N/A');
        addTableRow('Date of Manufacturing', date || 'N/A');
        addTableRow('Customer Name', customer || 'N/A');
        addTableRow('Remarks', remarks || 'N/A');
    }

    function addTableRow(label, value) {
        const row = document.createElement('div');
        row.className = 'table-row';

        const labelCell = document.createElement('div');
        labelCell.className = 'table-cell';
        labelCell.textContent = label;

        const valueCell = document.createElement('div');
        valueCell.className = 'table-cell';
        valueCell.textContent = value;

        row.appendChild(labelCell);
        row.appendChild(valueCell);
        resultsTable.appendChild(row);
    }

    function showNoResults() {
        noResults.style.display = 'block';
        resultsTable.style.display = 'none';
    }

    function parseCSVRow(row) {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"' && row[i + 1] === '"') {
                current += '"';
                i++;
            } else if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }

    function showLoading(show) {
        if (show) {
            loadingOverlay.classList.add('active');
        } else {
            loadingOverlay.classList.remove('active');
        }
    }
});
