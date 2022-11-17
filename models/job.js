const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {

    /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyid }
   *
   * Returns { title, salary, equity, companyid }
   *
   * Throws BadRequestError if job is already in database.
   * */
    static async create({title, salary, equity, companyid}) {
        const duplicateCheck = await db.query(
            `SELECT title
             FROM jobs
             WHERE title = $1`,
          [title]);

        if (duplicateCheck.rows[0]){
            throw new BadRequestError(`Duplicate job: ${title}`);
        }

        const result = await db.query(
            `INSERT INTO jobs
             (title, salary, equity, company_id)
             VALUES ($1, $2, $3, $4)
             RETURNING title, salary, equity, company_id as 'companyid'`,
          [
            title,
            salary,
            equity,
            companyid
          ],
      );
      const job = result.rows[0];

      return job;
    }

    static async findAll(queryObj = {}) {
        const {title, minSalary, hasEquity} = queryObj
        const givenFilters = []
        console.log(title)
        let baseQuery = `SELECT id,
                                title,
                                salary,
                                equity,
                                company_handle AS companyHandle
                                FROM jobs`
        let finalQueryArr = []

        if(title !== undefined){
            givenFilters.push(title)
            finalQueryArr.push(`title=$${givenFilters.length}`)
        }

        if(minSalary !== undefined){
            givenFilters.push(minSalary)
            finalQueryArr.push(`salary > $${givenFilters.length}`)
        }

        if(hasEquity === 'true'){
            finalQueryArr.push('equity > 0')
        }
        if(givenFilters.length > 0){
            baseQuery += ' WHERE ' + finalQueryArr.join(' AND ')
        }

        let finalQuery = baseQuery + ' ORDER BY title'
        let result = await db.query(finalQuery, givenFilters)

        return result.rows
      }

      /** Given a job title, return data about job.
       *
       * Returns { id, title, salary, equity, companyid } from job.
       *
       * Throws NotFoundError if not found.
       **/

      static async get(id) {
        const jobRes = await db.query(
              `SELECT id,
                      title,
                      salary,
                      equity,
                      company_handle AS companyHandle
               FROM jobs
               WHERE id = $1`,
            [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job with id: ${id}`);

        return job;
      }

      /** Update job data with `data`.
       *
       * This is a "partial update" --- it's fine if data doesn't contain all the
       * fields; this only changes provided ones.
       *
       * Data can include: {title, salary, equity}
       *
       * Returns { id, title, salary, equity, companyid }
       *
       * Throws NotFoundError if not found.
       */

      static async update(title, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
              companyid: "company_id",
            });
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs
                          SET ${setCols}
                          WHERE title = ${idVarIdx}
                          RETURNING id,
                                    title,
                                    salary,
                                    equity,
                                    company_id AS "companyid"`;
        const result = await db.query(querySql, [...values, title]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job with title: ${title}`);

        return job;
      }

      /** Delete given job from database; returns undefined.
       *
       * Throws NotFoundError if job not found.
       **/

      static async remove(title) {
        const result = await db.query(
              `DELETE
               FROM jobs
               WHERE title = $1
               RETURNING title`,
            [title]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job with title: ${title}`);
      }

}

module.exports = Job