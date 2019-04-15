/*
#	main file for searching and rendering data returned from SOLR data
*/

$(document).ready(function() { //wait for document to load
	$('#advSearchBox').css({ "display": "none" }); //hide advanced search inputs
	$('#searchResults').css({ "display": "none" }); //hide search results table
	var tableHeader = $('tbody').html(); //save table header HTML for when table gets refreshed

	//function for toggling display of advanced search inputs
	$('#advSearch').on("click", function() {
		if ($(this).html() === "Show") {
			$("#advSearchBox").css({ "display": "block" });
			$(this).html("Hide");
		} else {
			$("#advSearchBox").css({ "display": "none" });
			$(this).html("Show");
		}
	});

	//global variables
	var url = "https://search.cdc.gov/srch/internet_clia/select?q="; //solr url
	var rows = "&rows=50"; //limit results to 50 at a time
	var start = 0; //initial first result
	var end = 50; //initial end result

	//function for searching and getting results from SOLR
	$('#btnSearch').on("click", function() {
		$('#searchResults').css({ "display": "block" }); //display search results table

		//make variables of all search input fields
		var CLIANumInpt = $('#inputCLIANumber').val().toUpperCase();
		var LabNameInpt = $('#inputLabName').val();
		if (LabNameInpt !== "") { //make case insensitive and replace spaces with %20
			LabNameInpt.toLowerCase();
			LabNameInpt.replace(/ /g, "%20");
		}
		LabNameInpt = "*"+LabNameInpt+"*";
		var cityInpt = $('#inputCity').val();
		if (cityInpt !== "") { //make case insensitive and replace spaces with %20
			cityInpt.toLowerCase();
			cityInpt.replace(/ /g, "%20");
		}
		cityInpt = "*"+cityInpt+"*"; //make wildcards so string can be found anywhere in the field
		var zipInpt = $('#inputZip').val();
		zipInpt.toString();
		var stateInpt = $('#lstState').val();
		if (stateInpt[0] === "00") stateInpt[0] = "";
		var labTypeInpt = $('#selectLabType').val();
		if (labTypeInpt[0] === "00") labTypeInpt[0] = "";
		var certTypeInpt = $('#selectCertType').val();
		if (certTypeInpt[0] === "00") certTypeInpt[0] = "";

		var valArr = []; //make array of inputs
		valArr.push(CLIANumInpt);
		valArr.push(LabNameInpt);
		valArr.push(cityInpt);
		valArr.push(zipInpt);
		valArr.push(stateInpt[0]);
		valArr.push(labTypeInpt[0]);
		valArr.push(certTypeInpt[0]);

		var searchTerm = ""; //declare search term variable

		if (valArr[0] === "" && valArr[1] === "" && valArr[2] === "" && valArr[3] === "" && valArr[4] === "" && valArr[5] === "" && valArr[6] === "") {
			searchTerm = "*:*"; //if no inputs, return full search
		} else { //else if there's any inputs
			var haveInpt = []; //making an array for testing which inputs are not empty
			for (var i = 0; i < valArr.length; i++) {
				if (valArr[i] !== "") {
					haveInpt.push(true);
				} else {
					haveInpt.push(false);
				}
			}
			if (haveInpt[0] === true) { //if the lab number has an input, it will be one return and take precedence
				searchTerm = "PRVDR_NUM:"+valArr[0]; //search term is just lab number (which is also the first entry in valArr)
			} else { //else if there are other inputs
				var index = haveInpt.indexOf(true); //find the first instance of an input in the haveInpt array
				function returnLabel(index) { //function for putting search label on the index of the valArr
					switch (index) {
						case 0:
							return "PRVDR_NUM:";
							break;
						case 1:
							return "FACILITY:";
							break;
						case 2:
							return "CITY_NAME:";
							break;
						case 3:
							return "ZIP_CD:";
							break;
						case 4:
							return "STATE_CD:";
							break;
						case 5:
							return "GNRL_FAC_TYPE_DESC:";
							break;
						case 6:
							return "TYPE:";
							break;
					}
				}
				searchTerm = returnLabel(index) + valArr[index]; //the first input should have the label and value of the first 'true' index
				for (var w=index+1; w<valArr.length; w++) { //create a for loop for checking of there's another input after the first 'true' index
					if (haveInpt[w] === true) { //if there is another input, the search term needs to have a boolean
						searchTerm += "+AND+" + returnLabel(w) + "\"" + valArr[w] + "\"" ;
					}
				}
			}
		}

		var query = url + searchTerm + rows + "&distrib=false"; //query includes url, filtered search terms, and number of entries (rows and start point)
		console.log(query);

		//ajax call for getting data from SOLR
		$.ajax({
			url: query,
			'data': {'q': searchTerm, 'wt':'json', 'rows':'50', 'distrib':'false'},
                         'success': function(data) { 
                                console.log(data.response.numFound);
                                var range = data.response.numFound; //set range as "numFound" key that lists number of entries returned
				                displayRange(data, searchTerm, start, end); //function that renders range, start, end, and previous and/or next arrows of displayed results
                  },
                  'dataType': 'jsonp',
                  'jsonp': 'json.wrf'
		});
	});

	//function that renders a display of current entries returned, as well as links to previous and/or next arrows that are shown on top of table data
	function displayRange(returnedData, searchTerm, start, end) { //params: returned data, search term used, start and end of displayed range
		renderTable(returnedData); //function that renders table of current SOLR data
		var range = returnedData.response.numFound; //set range as number of entries returned in API
		//console.log("start: "+start+" end: "+end+" range: "+range);
		var nextBttn = " <a href='#' id='nextTag'> Next >></a>"; //string for next button link
		var prevBttn = "<a href='#' id='prevTag'><< Prev</a> "; //string for previous button link
		var str = "Laboratories " + parseInt(start+1) + " to " + end + " of " + range; //displays range of current entries returned
		if (start == 0 && end > range) { //for entries that start at 0 and if the end (50) is greater than returned range
			str = "Laboratories " + parseInt(start+1) + " to " + range + " of " + range; //display entries as 1 to end of range
		} else if (start == 0 && end < range) { //else if entries start at 0 and range is greater than 50
			str += nextBttn; //rendered string will be display range and next link
		} else if (start > 0 && end < range) { //else if entries are greater than 0 and less than range
			str = prevBttn + str + nextBttn; //render a previous link, displayed range, and next link
		} else if (end > range) { //if end value is greater than range
			str = prevBttn + "Laboratories " + parseInt(start+1) + " to " + range + " of " + range; //display previous link as well as current range
		}
		$('#displayRange').html(str); //render str on top of rendered table data

		//function for stepping next returned results
		$('#nextTag').on("click", function() {
			//console.log("next fired");
			start += 50; //increment start of range by 50 entries
			end += 50; //increment end of range by 50 entries
			rows = "&rows=50&start="+parseInt(start+1); //adjust start query to new start value
			var query = url + searchTerm + rows; //set current query
			//ajax call for re-rendering next range of returned data
			$.ajax({
				type: "GET",
				url: query,
				'data': {'q': searchTerm,'wt':'json','rows':rows, 'distrib':'false', 'start':start},
				'success': function(data) {
					//console.log(data);
					var range = data.response.numFound;
					displayRange(data, searchTerm, start, end); //re-run displayRange function
				},
                                'dataType': 'jsonp',
                                'jsonp': 'json.wrf'
			});
		});
		//function for stepping previous returned results
		$('#prevTag').on("click", function() {
			start -= 50; //decrement start 50 entries
			end -= 50; //decrement end 50 entries
			rows = "&rows=50&start="+parseInt(start+1); //adjust query with decremented start
			var query = url + searchTerm + rows; //formatted query
			$.ajax({
				type: "GET",
				url: query,
				'data': {'q': searchTerm,'wt':'json','rows':rows,'distrib':'false', 'start':start},
				'success': function(data) {
					//console.log(data);
					var range = data.response.numFound;
					displayRange(data, searchTerm, start, end); //re-run displayRange function
				},
                                'dataType': 'jsonp',
                                'jsonp': 'json.wrf'
			});
		});	
	}

	//function for rendering returned data in table
	function renderTable(returnedData) {
		$('tbody').empty(); //empty any previous data in table
		$('tbody').append(tableHeader); //add the stored table header
		var displayData = returnedData.response.docs; //setting variable of array of returned entries
		for (var i=0; i < displayData.length; i++) {
			if (displayData[i].TYPE == "PPM") { //conditionals for making certification type entries readable
				var certType = "Microscopy";
			} else if (displayData[i].TYPE == "Compliance") {
				var certType = "Certificate of Compliance";
			} else if (displayData[i].TYPE == undefined) {
				var certType = "";
			} else {
				var certType = displayData[i].TYPE
			}
			var displayName = displayData[i].FACILITY; //format lab name by replacing all %20 char with spaces
			var displayCity = displayData[i].CITY_NAME; //format city by replacing all %20 char with spaces
			var str = "<tr>"+
					"<td style='width:140px;'>"+displayData[i].PRVDR_NUM+
					"</td><td>"+displayData[i].GNRL_FAC_TYPE_DESC +
					"</td><td>"+certType+
					"</td><td>"+
						"<b>"+displayName+"</b><br>"+ //proper case function
						displayData[i].ADDRESS+", <br>"+
						displayCity+",&nbsp;"+ //proper case function
						displayData[i].STATE_CD+"&nbsp;&nbsp;"+
						displayData[i].ZIP_CD+"&nbsp;<br>"+
						"Tel:&nbsp;"+formatPhoneNumber(displayData[i].PHNE_NUM)+                  
					"</td></tr>";
			$('tbody').append(str);
		};
	};	

	// universal function for converting string to proper case
	function toTitleCase(str) {
		return str.replace(
			/([^\W_]+[^\s-]*) */g,
			function(txt) {
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			}
		);
	};


        // Format Telephone number
        function formatPhoneNumber(str) {
        var cleaned = ('' + str).replace(/\D/g, '')
        var match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
          if (match) {
            return '(' + match[1] + ') ' + match[2] + '-' + match[3]
          }
        return null
        }
});
