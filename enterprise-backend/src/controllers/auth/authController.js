async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    if (email === 'admin@raftop.local' && password === '123456') {
      return res.json({
        success: true,
        data: {
          accessToken: 'super_admin_demo_token',
          user: {
            id: 'user_1',
            email: 'admin@raftop.local',
            first_name: 'Platform',
            last_name: 'Owner',
            is_platform_super_admin: true
          }
        }
      });
    }

    if (email === 'tenant@raftop.local' && password === '123456') {
      return res.json({
        success: true,
        data: {
          accessToken: 'tenant_demo_token',
          user: {
            id: 'user_2',
            email: 'tenant@raftop.local',
            first_name: 'Tenant',
            last_name: 'User',
            is_platform_super_admin: false
          }
        }
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    if (req.user?.is_platform_super_admin) {
      return res.json({
        success: true,
        data: {
          user: req.user,
          currentOrganization: null
        }
      });
    }

    return res.json({
      success: true,
      data: {
        user: req.user,
        currentOrganization: {
          id: 'org_1',
          name: 'RAFTOPOULOS Demo Organization',
          slug: 'raftopoulos-demo',
          status: 'active'
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    return res.json({
      success: true,
      data: {
        loggedOut: true
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  me,
  logout
};