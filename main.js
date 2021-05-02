const url = "https://raw.githubusercontent.com/neshkatrapati/covid-telangana.github.io/master/data/beds.csv";
var DataFrame = dfjs.DataFrame;

var hospitalBeds;
const selectedColumns = ["NAME OF THE HOSPITAL", "TYPE", "CONTACT NO","REGULAR BEDS VACANT", "OXYGEN BEDS VACANT","ICU BEDS (Ventilator/ CPAP) VACANT", "LAST UPDATED"];

const numericColumns = ["REGULAR BEDS VACANT", "OXYGEN BEDS VACANT","ICU BEDS (Ventilator/ CPAP) VACANT"]

loadData = function(){
    DataFrame.fromCSV(url).then(function(df) {
        
        
        for(var i=0; i < numericColumns.length;i++){
            df = df.cast(numericColumns[i], Number);
        }

        window.hospitalBeds = df;
        var uniqueDistricts = hospitalBeds.distinct('DISTRICT');
        populateDistricts(uniqueDistricts.toArray());
        populateData();

        var districtBox = document.getElementById('district');
        districtBox.onchange = function(ev) {
            populateData();
        }

        var hospitalTypesCheckBoxes = document.getElementsByName('hospital_type');
        
        for (var i=0; i<hospitalTypesCheckBoxes.length; i++){
        
            hospitalTypesCheckBoxes[i].onchange = function(ev) {
                populateData();
            }
        
        }


        var sortOrderRadios = document.getElementsByName('sort_order');
        
        for (var i=0; i<sortOrderRadios.length; i++){
        
            sortOrderRadios[i].onchange = function(ev) {
                populateData();
            }
        
        }

    });
}

populateDistricts = function(districts) {
    var districtBox = document.getElementById('district');
    for(var i=0;i < districts.length; i++){
        districtBox.add(new Option(districts[i], districts[i]));
    }
}

populateData = function() {
    var districtBox = document.getElementById('district');
    var selectedDistrict = districtBox.value;
    //console.log(selectedDistrict);

    var hospitalTypesCheckBoxes = document.getElementsByName('hospital_type');
    var selectedHospitalTypes = [];
    for (var i=0; i<hospitalTypesCheckBoxes.length; i++){
        if (hospitalTypesCheckBoxes[i].checked){
            selectedHospitalTypes.push(hospitalTypesCheckBoxes[i].value);
        }
    }

    var sortOrderRadios = document.getElementsByName('sort_order');
    var selectedSortColumn;
    for (var i=0; i<sortOrderRadios.length; i++){
        if (sortOrderRadios[i].checked){
            selectedSortColumn = sortOrderRadios[i].value;
            break;
        }
    }


    var selectedDF = hospitalBeds.filter(row => row.get('DISTRICT') == selectedDistrict);
    selectedDF = selectedDF.filter(row => selectedHospitalTypes.includes(row.get('TYPE')));
    console.log(selectedSortColumn, selectedSortColumn.length);
    selectedDF = selectedDF.sortBy(selectedSortColumn, true);
    selectedDF = selectedDF.toCollection();
    var dataTable = document.getElementById('hospital_data_body');
    dataTable.innerHTML = "";
    for(var i=0; i < selectedDF.length; i++){
        var newRow = dataTable.insertRow(-1);
        for (var j=0; j < selectedColumns.length; j++) {
            var cell = newRow.insertCell(-1);
            cell.innerHTML = selectedDF[i][selectedColumns[j]];
        }
    }
    //console.log(selectedHospitalTypes);
}