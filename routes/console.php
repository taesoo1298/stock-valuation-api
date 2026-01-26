<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Stock data sync schedule (KST timezone)
// Weekdays at 06:30 KST (21:30 UTC previous day)
Schedule::command('stocks:sync-all')
    ->weekdays()
    ->at('21:30')
    ->timezone('UTC');

// Saturday full sync at 10:00 KST (01:00 UTC)
Schedule::command('stocks:sync-all')
    ->saturdays()
    ->at('01:00')
    ->timezone('UTC');
