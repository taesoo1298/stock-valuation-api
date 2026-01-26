<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Sector;
use Illuminate\Http\JsonResponse;

class SectorController extends Controller
{
    public function index(): JsonResponse
    {
        $sectors = Sector::query()
            ->withCount('stocks')
            ->get();

        return response()->json([
            'data' => $sectors,
        ]);
    }

    public function show(Sector $sector): JsonResponse
    {
        $sector->loadCount('stocks');

        return response()->json([
            'data' => $sector,
        ]);
    }

    public function stocks(Sector $sector): JsonResponse
    {
        $stocks = $sector->stocks()
            ->with(['metrics' => fn ($q) => $q->latest('date')->limit(1)])
            ->where('is_active', true)
            ->get();

        return response()->json([
            'data' => $stocks,
        ]);
    }
}
