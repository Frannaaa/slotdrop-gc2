// Group assignment: Fran. HTTP handlers for studio references and applications.
import { Router } from "express";
import {
  findProvider,
  createApplication,
  findApplication,
} from "../services/providers.js";

export function providerRouter(db, clock) {
  const router = Router();
  router.get("/providers/:id", async (req, res) => {
    res.json(await findProvider(db, req.params.id, clock));
  });
  router.post("/provider-applications", async (req, res) => {
    const { status, application } = await createApplication(db, req.body);
    res.status(status).json(application);
  });
  router.get("/provider-applications/:id", async (req, res) => {
    res.json(await findApplication(db, req.params.id));
  });
  return router;
}
