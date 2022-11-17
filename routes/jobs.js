"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError, ExpressError } = require("../expressError");
const { ensureLoggedIn, checkAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const companyNewSchema = require("../schemas/companyNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

router.post("/", checkAdmin, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, companyNewSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }

      const company = await Company.create(req.body);
      return res.status(201).json({ company });
    } catch (err) {
      return next(err);
    }
  });

  /** GET /  =>
   *   { jobs: [ { id, title, salary, equity, companyHandle }, ...] }
   *
   * Can filter on provided search filters:
   * - title
   * - minSalary
   * - equity (true or false)
   *
   * Authorization required: none
   */

  router.get("/", async function (req, res, next) {
    try {
      let query = req.query
      console.log(query)
      const jobs = await Job.findAll(query);

      return res.json({ jobs });
    } catch (err) {
      return next(err);
    }
  });

  /** GET /[handle]  =>  { company }
   *
   *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity }, ...]
   *
   * Authorization required: none
   */

  router.get("/:id", async function (req, res, next) {
    try {
      const job = await Job.get(req.params.id);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  });

  /** PATCH /[handle] { fld1, fld2, ... } => { company }
   *
   * Patches company data.
   *
   * fields can be: { name, description, numEmployees, logo_url }
   *
   * Returns { handle, name, description, numEmployees, logo_url }
   *
   * Authorization required: admin
   */

  router.patch("/:id", checkAdmin, async function (req, res, next) {
    try {
      const validator = jsonschema.validate(req.body, jobUpdateSchema);
      if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
      }

      const job = await Job.update(req.params.id, req.body);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  });

  /** DELETE /[handle]  =>  { deleted: handle }
   *
   * Authorization: admin
   */

  router.delete("/:id", checkAdmin, async function (req, res, next) {
    try {
      await Job.remove(req.params.id);
      return res.json({ deleted: req.params.id });
    } catch (err) {
      return next(err);
    }
  });


  module.exports = router;