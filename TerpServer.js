"use strict";
// adding everything I need
const path = require("path");
const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); 

// importing from dataRetrieving.js
const {
  rateAllClassesForProfessor,
  rateAllProfessorsForClass,
  loadData,
  getEverything,
  sortbyReviewCount,
  sortbyRating,
  totalProfessors,
  totalCourses
} = require("./dataRetrieving");

// open port
const portNumber = process.env.PORT || 2003;



// getting access to templates (webpages) and public (stylesheet)
process.stdin.setEncoding("utf8");
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "templates"));
app.use(express.static(path.join(__dirname, "public")));

// index page
app.get("/", (req, res) => {

  res.render("index" ,{ errorSearch: "", courseTotal: totalCourses(), profTotal: totalProfessors()});
});

// sorting current table by ratings
app.get("/sort/ratings", async (req, res) => {
    const currTable = req.query.table;
    const name = req.query.name;

    if (currTable == "course") {
      const allElements = await rateAllClassesForProfessor(name);
      const sortedCourses = sortbyRating(allElements);
      res.json(sortedCourses);

    } else {
      const allElements = await rateAllProfessorsForClass(name);
      const sortedProfs = sortbyRating(allElements);
      res.json(sortedProfs);
    }
});

// sorting current table by review count
app.get("/sort/reviewTotal", async (req, res) => {
    const currTable = req.query.table;
    const name = req.query.name;

    if (currTable == "course") {
      const allElements = await rateAllClassesForProfessor(name);
      const sortedCourses = sortbyReviewCount(allElements);
      res.json(sortedCourses);

    } else {
      const allElements = await rateAllProfessorsForClass(name);
      const sortedProfs = sortbyReviewCount(allElements);
      res.json(sortedProfs);
    }
});

// when you search 
app.get("/results", async (req, res) => {
  const name = req.query.search_query;
  let table = "";
  
  try{
    // professor first, then check courses if empty
    const allCourses = await rateAllClassesForProfessor(name);

    if (allCourses.length == 0) {
      const allProfessors = await rateAllProfessorsForClass(name);
      if (allProfessors.length == 0){
        res.render("index" ,{ errorSearch: `This result does not exist`, courseTotal: totalCourses(), profTotal: totalProfessors()});
      }
      else {
        // matches for course
        table = '<table><tr><th>Professor</th><th>Average Rating</th><th>Total Reviews</th></tr>';
        allProfessors.forEach(professor => {
        table += `<tr><td>${professor.professor}</td>
                            <td>${professor.average_rating}</td>
                            <td>${professor.total_reviews}</td></tr>`;
        
        });

        table += `</table>`;
        res.render("professorTable", {name, table});

      }
    } else {
      // matches professor, making table for all course they have
      table = `<table><tr><th>Courses</th><th>Average Rating</th><th>Total Reviews</th></tr>`;
      allCourses.forEach(course => {
      table += `<tr><td>${course.course}</td>
                      <td>${course.average_rating}</td>
                      <td>${course.total_reviews}</td></tr>`;
      
      });
      table += `</table>`;
      res.render("courseTable", {name, table});
    }
  } catch(error) {

    console.error("Not creating table:", error.message);

    res.render("index" ,{ errorSearch: `An error occurred`, courseTotal: totalCourses(), profTotal: totalProfessors()});
  }
  
  
});

// gets matching queries for autocomplete when searching 
app.get("/suggestion", (req, res) => {
  const query = req.query.q?.toLowerCase() || "";

  //send json file for matches up to 10 choices
  if (query.length === 0) {
    return res.json([]);
  }

  const matches = getEverything()
    .filter(name =>
      name.toLowerCase().startsWith(query)
    )
    .slice(0, 10);

  res.json(matches);
});

loadData().then(() => {
  app.listen(portNumber, () => {
    console.log(`Web server is running at http://localhost:${portNumber}`);
    console.log("Stop to shutdown the server");
  });
});

// info for closing and opening server on terminal
process.stdin.on('readable', () => {
  const dataInput = process.stdin.read();
  if (dataInput !== null) {
    const command = dataInput.trim();
    if (command === "stop") {
      process.stdout.write("Shutting down the server");
      process.exit(0);
    } else {
      process.stdout.write(`Invalid command: ${command}`);
    }
    process.stdin.resume();
  }
});
