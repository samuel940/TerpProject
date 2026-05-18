"use strict";
// adding everything I need
const path = require("path");
const express = require("express");
const app = express();
const alasql = require("alasql");

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); 

// importing from dataRetrieving.js
const {
  rateAllClassesForProfessor,
  rateAllProfessorsForClass,
  loadData,
  getAllProfessors,
  getAllCourses
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
  res.render("index" ,{ errorProf: "", errorCourse: ""});
});

// gets matching queries for autocomplete when searching for professor
app.get("/suggest/professors", (req, res) => {
  const query = req.query.q?.toLowerCase() || "";

  //send json file for matches up to 10 choices
  if (query.length === 0) {
    return res.json([]);
  }

  const matches = getAllProfessors()
    .filter(name =>
      name.toLowerCase().startsWith(query)
    )
    .slice(0, 10);

  res.json(matches);
});

// gets matching queries for autocomplete when searching for course
app.get("/suggest/courses", (req, res) => {
  const query = req.query.q?.toLowerCase() || "";

  //send json file for matches up to 10 choices
  if (query.length === 0) {
    return res.json([]);
  }

  const matches = getAllCourses()
    .filter(course =>
      course.toLowerCase().startsWith(query)
    )
    .slice(0, 10);

  res.json(matches);
});

// when you search a specific professor
app.get("/professor", async (req, res) => {
  const professor = req.query.professor;
  let courseTable = '<table><tr><th>Courses</th><th>Average Rating</th><th>Total Reviews</th></tr>';
  
  try {
    const allCourses = await rateAllClassesForProfessor(professor);

    if (allCourses.length == 0) {
      res.render("index" ,{ errorProf: `This professor does not exist`, errorCourse: ""});
    } else {

      //console.log(allCourses[0]);
    allCourses.forEach(course => {
      courseTable += `<tr><td>${course.course}</td><td>${course.average_rating}</td><td>${course.total_reviews}</td></tr>`;
      
    });

    courseTable += `</table>`;
    res.render("courseTable", {professor, courseTable});

    }
    
    
  } catch(error) {

    console.error("Not creating table:", error.message);

    res.render("index" ,{ errorProf: `This professor does not exist`, errorCourse: ""});
  }
  
});

// when you search a specific course
app.get("/course", async (req, res) => {
  const course = req.query.course;
  let professorTable = '<table><tr><th>Professor</th><th>Average Rating</th><th>Total Reviews</th></tr>';

  try {
    const allProfessors = await rateAllProfessorsForClass(course);

    if (allProfessors.length == 0) {
      res.render("index" ,{ errorProf: "", errorCourse: `This course does not exist`});
    } else {
      allProfessors.forEach(professor => {
      professorTable += `<tr><td>${professor.professor}</td><td>${professor.average_rating}</td><td>${professor.total_reviews}</td></tr>`;
      
    });

    professorTable += `</table>`;
    res.render("professorTable", {course, professorTable});

    }
    
    
  } catch(error) {

    console.error("Not creating table:", error.message);

    res.render("index" ,{ errorProf: "", errorCourse: `This course does not exist`});
  }
  
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
