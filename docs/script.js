window.onload = () => {
    window.addEventListener('drop', onDrop, false);
    window.addEventListener('dragenter', cancel, false);
    window.addEventListener('dragleave', cancel, false);
    window.addEventListener('dragover',  cancel, false);
};
const cancel = e => {
    e.stopPropagation();
    e.preventDefault();
};

const onDrop = e => {
    cancel(e);
    var r = new FileReader();
    r.onload = e => {
        const metaArea = document.getElementById('fontmeta');
        const error = document.getElementById('error');
    
        let fontMeta;
        try {
            fontMeta = FontName.parse(e.target.result)[0];
        } catch (e) {
            error.textContent = e.message;
            metaArea.innerHTML = '';
            console.error(e);
            return;
        }
        console.log(fontMeta);

        error.textContent = '';
        metaArea.innerHTML = '';
        Object.keys(fontMeta).forEach(key => {
            const value = fontMeta[key];
            const el = document.createElement('tr');
            el.innerHTML = `<td><strong>${key}</strong></td><td>${value}</td>`;
            metaArea.appendChild(el);
        });
    };
    r.readAsArrayBuffer(e.dataTransfer.files[0]);
};
