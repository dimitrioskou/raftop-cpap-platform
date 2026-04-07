const plans = [
  {
    id: 'plan_enterprise_1',
    code: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'Enterprise master tenant plan',
    monthly_price: 1200,
    annual_price: 14400,
    setup_fee: 12000,
    is_reseller_enabled: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'plan_doctor_basic_1',
    code: 'DOCTOR_BASIC',
    name: 'Doctor Basic',
    description: 'Basic doctor tenant plan',
    monthly_price: 29,
    annual_price: 290,
    setup_fee: 0,
    is_reseller_enabled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'plan_clinic_advanced_1',
    code: 'CLINIC_ADVANCED',
    name: 'Clinic Advanced',
    description: 'Advanced clinic tenant plan',
    monthly_price: 79,
    annual_price: 790,
    setup_fee: 0,
    is_reseller_enabled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function findAll() {
  return plans;
}

async function findById(planId) {
  return plans.find((item) => String(item.id) === String(planId)) || null;
}

async function create(payload) {
  const item = {
    id: `plan_${Date.now()}`,
    code: payload.code,
    name: payload.name,
    description: payload.description || '',
    monthly_price: Number(payload.monthly_price || 0),
    annual_price: Number(payload.annual_price || 0),
    setup_fee: Number(payload.setup_fee || 0),
    is_reseller_enabled: !!payload.is_reseller_enabled,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  plans.unshift(item);
  return item;
}

async function update(planId, payload) {
  const index = plans.findIndex((item) => String(item.id) === String(planId));

  if (index === -1) {
    return null;
  }

  plans[index] = {
    ...plans[index],
    ...payload,
    id: plans[index].id,
    updated_at: new Date().toISOString()
  };

  return plans[index];
}

module.exports = {
  findAll,
  findById,
  create,
  update
};