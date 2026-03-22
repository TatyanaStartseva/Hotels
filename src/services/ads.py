def weight_by_plan(plan_name: str)->int:
    return {"basic":1, "premium":3,"vip":8,}.get(plan_name,1)