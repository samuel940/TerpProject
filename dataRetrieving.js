"use strict";

const alasql = require("alasql");
const fs = require("fs");

let allProfessors = [];
let allCourses = [];

async function fetchAllPaginated(baseUrl) {
  let results = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const response = await fetch(`${baseUrl}&offset=${offset}`);
    const data = await response.json();

    // Stop if no more results
    if (data.length === 0) {
      break;
    }

    results = results.concat(data);

    // Stop if final partial page
    if (data.length < limit) {
      break;
    }

    offset += limit;
  }

  return results;
}

async function loadData() {
  try {

    const [profData, courseData] = await Promise.all([
      fetchAllPaginated("https://planetterp.com/api/v1/professors?"),
      fetchAllPaginated("https://planetterp.com/api/v1/courses?")
    ]);

    allProfessors = [...new Set(
      profData.filter(prof => prof.average_rating !== null).map(prof => prof.name)
    )];

    allCourses = [...new Set(
      courseData.map(course => course.name)
    )];

    console.log("Loaded autocomplete data");

  } catch (error) {
    console.error("Failed to load autocomplete data:", error);
  }
}
function getAllProfessors() {
  return allProfessors;
}

function getAllCourses() {
  return allCourses;
}

function sortbyReviewCount(allElements) {
  return [...allElements].sort((a, b) =>
    Number(b.total_reviews) - Number(a.total_reviews)
  );
}

function sortbyRating(allElements) {
  return alasql(`
    SELECT *
    FROM ?
    ORDER BY average_rating DESC
  `, [allElements]);
}

async function rateAllClassesForProfessor(name) {

  const encodedName = encodeURIComponent(name);

  const url = `https://planetterp.com/api/v1/professor?name=${encodedName}&reviews=true`;
  
  try {

    const response = await fetch(url);
    const json = await response.json();
    const allReviews = json.reviews;

    // SQL query
    let results = alasql(`
      SELECT
        course,
        ROUND(AVG(rating) * 100) / 100 AS average_rating,
        COUNT(*) AS total_reviews
      FROM ?
      GROUP BY course
      ORDER BY total_reviews DESC
    `, [allReviews]);

    results = results.filter(result => result.course !== null);

    return results;

  } catch(error) {
    console.error("Failed to fetch or process professor reviews:", error.message);
    return [];
  }
}

async function rateAllProfessorsForClass(name) {
  const url = `https://planetterp.com/api/v1/course?name=${name}&reviews=true`;

  try {

    const response = await fetch(url);
    const json = await response.json();
    const allReviews = json.reviews;

    // SQL query
    let results = alasql(`
      SELECT
        professor,
        ROUND(AVG(rating) * 100) / 100 AS average_rating,
        COUNT(*) AS total_reviews
      FROM ?
      GROUP BY professor
      ORDER BY total_reviews DESC
    `, [allReviews]);

    results = results.filter(result => result.professor !== null);

    return results;

  } catch(error) {
    console.error("Failed to fetch or process course reviews:", error.message);
    return [];
  }
}

module.exports = {
  rateAllClassesForProfessor,
  rateAllProfessorsForClass,
  loadData,
  getAllProfessors,
  getAllCourses,
  sortbyReviewCount,
  sortbyRating
};
