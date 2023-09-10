function addServingOptions(servingSize) {
    
    for (let i = 1; i <= servingSize; i++) {
        const option = `<option value="${i}">${i}</option>`;
        $('#serving').append(option);
    }
}