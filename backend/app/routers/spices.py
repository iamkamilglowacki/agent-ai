from fastapi import APIRouter, HTTPException
from app.services.woocommerce_service import woocommerce_service

router = APIRouter(
    prefix="/spices",
    tags=["spices"]
)

@router.get("/")
async def get_all_spices():
    """
    Pobiera wszystkie dostępne przyprawy ze sklepu WooCommerce
    """
    try:
        spices = await woocommerce_service.get_all_spices()
        return {"spices": spices}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{spice_id}")
async def get_spice(spice_id: int):
    """
    Pobiera konkretną przyprawę po ID
    """
    try:
        spice = await woocommerce_service.get_spice_by_id(spice_id)
        return spice
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 