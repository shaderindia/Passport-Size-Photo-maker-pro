function autoFix() {
    // Set the spacing and margin values
    const selectedUnit = getSelectedUnit(); // Assume this function gets the current unit
    const spacing = 30; // Fixed value for spacing and margins
    setInputValue('horizontalSpacing', spacing, selectedUnit);
    setInputValue('verticalSpacing', spacing, selectedUnit);
    setInputValue('marginTop', spacing, selectedUnit);
    setInputValue('marginLeft', spacing, selectedUnit);

    // Disable auto-center margins
    disableAutoCenterMargins(); // Assume this function disables auto-centering logic

    // Visual feedback on button
    const button = document.getElementById('autoFixButton');
    if (button) {
        button.classList.add('active'); // Example of adding an active class for feedback
        // Optionally set a timeout to remove the feedback after a brief moment
        setTimeout(() => button.classList.remove('active'), 2000);
    }
}