const url = "https://raw.githubusercontent.com/neshkatrapati/covid-telangana.github.io/master/data/district_data.csv";
var DataFrame = dfjs.DataFrame;


const apiURL = "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict";

var districtMapping;

Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10);
});

loadData = function(){
    DataFrame.fromCSV(url).then(function(df) {
        districtMapping = df;
        var dateInput = document.getElementById('date');
        var today = new Date();
        dateInput.value = today.toDateInputValue();

        populateStates(districtMapping.groupBy('state_id', 'state_name').listGroups());
        populateDistricts();


        var stateBox = document.getElementById('state');
        var districtBox = document.getElementById('district');
        
        stateBox.onchange = function() {
            populateDistricts();
            loadCenterData();
        }

        districtBox.onchange = function() {
            loadCenterData();
        }

        dateInput.onchange = function() {
            loadCenterData();
        }


        var hospitalTypesCheckBoxes = document.getElementsByName('hospital_type');
        
        for (var i=0; i<hospitalTypesCheckBoxes.length; i++){
        
            hospitalTypesCheckBoxes[i].onchange = function(ev) {
                loadCenterData();
            }
        
        }


        var minAgeRadios = document.getElementsByName('min_age');
        
        for (var i=0; i<minAgeRadios.length; i++){
        
            minAgeRadios[i].onchange = function(ev) {
                loadCenterData();
            }
        
        }


        loadCenterData();

    })
}



populateStates = function(states) {
    var stateBox = document.getElementById('state');
    for(var i=0;i < states.length; i++){
        stateBox.add(new Option(states[i]['state_name'], states[i]['state_id']));
    }
}


populateDistricts = function() {
    var districtBox = document.getElementById('district');
    districtBox.innerHTML = "";
    var stateBox = document.getElementById('state');
    var selectedState = stateBox.value;
    var districts = districtMapping.filter(row => row.get('state_id') == selectedState);
    districts = districts.toCollection();
    for(var i=0;i < districts.length; i++){
        districtBox.add(new Option(districts[i]['district_name'], districts[i]['district_id']));
    }
}

formatDate = function(MyDate) {
    MyDateString = ('0' + MyDate.getDate()).slice(-2) + '-'
             + ('0' + (MyDate.getMonth()+1)).slice(-2) + '-'
             + MyDate.getFullYear();
    return MyDateString;
}
var cdata;

convertToDF = function(centerData) {
    centerData = centerData.toCollection();
    newCenterData = [];
    for(var i=0;i<centerData.length;i++){
        newCenterData.push(centerData[i]['centers']);
    }
    return new DataFrame(newCenterData);
}


createCenterInfoTable = function(center_id) {
    var newTable = document.createElement('table');
    newTable.id = center_id;
    newTable.border = '1';
    var header = newTable.createTHead();
    var headerRow = header.insertRow(-1);
    var headers = ['Center ID', 'Center Name', 'Block Name', 'From', 'To', 'Type'];
    for (var i=0; i<headers.length; i++){
        var newCell = headerRow.insertCell(-1);
        newCell.innerHTML = headers[i];
    }
    return newTable;    
}

createSessionTable = function(center_id) {
    var newTable = document.createElement('table');
    newTable.id = center_id + '-' + 'sessions';
    newTable.border = '1';
    var header = newTable.createTHead();
    var headerRow = header.insertRow(-1);
    var headers = ['Date', 'Available Capacity', 'Min Age Limit', 'Slots', 'Vaccine Type'];
    for (var i=0; i<headers.length; i++){
        var newCell = headerRow.insertCell(-1);
        newCell.innerHTML = headers[i];
    }
    return newTable;    
}

loadCenterData = function() {
    var dateInput = document.getElementById('date');
    var districtBox = document.getElementById('district');

    var selectedDate = formatDate(new Date(dateInput.value));
  
    var selectedDistrict = districtBox.value;

    var requestApiURL = apiURL + '?district_id='+selectedDistrict + '&date='+selectedDate;
    console.log(requestApiURL);
    DataFrame.fromJSON(requestApiURL).then(function(df) {
        
        var centerDataDiv = document.getElementById('center_data');
        centerDataDiv.innerHTML = "";

        var hospitalTypesCheckBoxes = document.getElementsByName('hospital_type');
        var selectedHospitalTypes = [];
        for (var i=0; i<hospitalTypesCheckBoxes.length; i++){
            if (hospitalTypesCheckBoxes[i].checked){
                selectedHospitalTypes.push(hospitalTypesCheckBoxes[i].value);
            }
        }



        var minAgeRadios = document.getElementsByName('min_age');
        var selectedMinAge;
        for (var i=0; i<minAgeRadios.length; i++){
        
            if(minAgeRadios[i].checked) {
                selectedMinAge = minAgeRadios[i].value;
                break;
            }
        
        }


        var centerData = convertToDF(df);
        cdata = df;
        centerData = centerData.filter(row => selectedHospitalTypes.includes(row.get('fee_type')));
        centerData = centerData.toCollection();
        
        

        var selectedColumns = ["center_id", "name", "block_name", "from", "to", "fee_type"];
        for(var i =0;i<centerData.length;i++){
            var center = centerData[i];
            var centerTable = createCenterInfoTable(center['center_id']);
            var newRow = centerTable.insertRow(-1);
            
            //console.log(center);
            for (var j =0; j < selectedColumns.length; j++){
                var newCell = newRow.insertCell(-1);
                //console.log(center[selectedColumns[j]]);
                newCell.innerHTML = center[selectedColumns[j]];
            }

            
            var sessionTable = createSessionTable(center['center_id']);
            var selectedSessionColumns = ["date", "available_capacity", "min_age_limit", "slots","vaccine"];
            var hits  = 0;
            for (var j =0; j < center['sessions'].length; j++){
                var newRow = sessionTable.insertRow(-1);
                if (parseInt(center['sessions'][j]['min_age_limit']) <= selectedMinAge) {
                    hits += 1;
                    for (var k=0; k < selectedSessionColumns.length; k++) {
                    var newCell = newRow.insertCell(-1);
                    newCell.innerHTML = center['sessions'][j][selectedSessionColumns[k]];
                    }
                }
            }
            if (hits > 0){
                centerDataDiv.innerHTML += centerTable.outerHTML + '<br>';

                centerDataDiv.innerHTML += sessionTable.outerHTML + '<br>';
            }

        }

    });

}
