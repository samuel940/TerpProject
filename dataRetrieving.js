"use strict";

const alasql = require("alasql");
const fs = require("fs");

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
    console.error("Invalid JSON input:", error.message);
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
    console.error("Invalid JSON input:", error.message);
    return [];
  }
}

module.exports = {
  rateAllClassesForProfessor,
  rateAllProfessorsForClass
};
