import { createOrganizationSchema } from '../schemas/create-organization.schema.js'
import { OrganizationModel } from '../models/organization.model.js'
import { updateOrganizationSchema } from '../schemas/update-organization.schema.js'
import { uuidParamSchema } from '../schemas/uuid-param.schema.js'

export class OrganizationController {

  static async create(req, res) {
    try {
      const { organizationName, teamName } =
        createOrganizationSchema.parse(req.body)

      const user =
        await OrganizationModel.getUserOrganization(req.user.id)

      if (user?.teamId) {
        return res.status(400).json({
          error: 'User already belongs to a team'
        })
      }

      const result = await OrganizationModel.createWithTeam({
        organizationName,
        teamName,
        managerId: req.user.id
      })

      return res.status(201).json({
        organization: result.organization,
        team: result.team,
        manager: {
          id: result.manager.id,
          username: result.manager.username,
          email: result.manager.email,
          role: result.manager.role
        }
      })

    } catch (err) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          errors: err.issues
        })
      }

      if (err.code === 'P2002') {
        return res.status(400).json({
          error: 'Organization or manager already has a team'
        })
      }

      console.error(err)

      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }

  static async get(req, res) {
    try {
      const { organizationId } = req.params

      uuidParamSchema.parse({
        id: organizationId
      })

      const userId = req.user.id

      const organization =
        await OrganizationModel.getWithTeam(organizationId)

      if (!organization) {
        return res.status(404).json({
          error: 'Organization not found'
        })
      }

      const user =
        await OrganizationModel.getUserOrganization(userId)

      if (!user || user.organizationId !== organizationId) {
        return res.status(403).json({
          error: 'You do not belong to this organization'
        })
      }

      return res.status(200).json(organization)

    } catch (err) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          errors: err.issues
        })
      }

      console.error(err)

      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }

  static async getMembers(req, res) {
    try {
      const { organizationId } = req.params
      const userId = req.user.id

      const organization =
        await OrganizationModel.getById(organizationId)

      if (!organization) {
        return res.status(404).json({
          error: 'Organization not found'
        })
      }

      const user =
        await OrganizationModel.getUserOrganization(userId)

      if (!user || user.organizationId !== organizationId) {
        return res.status(403).json({
          error: 'You do not belong to this organization'
        })
      }

      const members =
        await OrganizationModel.getMembers(organizationId)

      return res.status(200).json(members)

    } catch (err) {
      console.error(err)

      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }

  static async update(req, res) {
    try {
      const { organizationId } = req.params
      const userId = req.user.id

      const { name } = updateOrganizationSchema.parse(req.body)

      const organization =
        await OrganizationModel.getById(organizationId)

      if (!organization) {
        return res.status(404).json({
          error: 'Organization not found'
        })
      }

      const user =
        await OrganizationModel.getUserOrganization(userId)

      if (!user || user.organizationId !== organizationId) {
        return res.status(403).json({
          error: 'You do not belong to this organization'
        })
      }

      if (user.role !== 'manager') {
        return res.status(403).json({
          error: 'Only the organization manager can update it'
        })
      }

      const updatedOrganization =
        await OrganizationModel.update(organizationId, { name })

      return res.status(200).json(updatedOrganization)

    } catch (err) {
      if (err.name === 'ZodError') {
        return res.status(400).json({
          errors: err.issues
        })
      }

      console.error(err)

      return res.status(500).json({
        error: 'Internal server error'
      })
    }
  }

}