<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('institutional_holders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_id')->constrained()->cascadeOnDelete();
            $table->string('holder_name');
            $table->unsignedBigInteger('shares')->nullable();
            $table->date('date_reported')->nullable();
            $table->decimal('percent_out', 8, 6)->nullable();
            $table->decimal('value', 20, 2)->nullable();
            $table->timestamps();

            $table->unique(['stock_id', 'holder_name', 'date_reported'], 'institutional_holder_unique');
            $table->index('stock_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('institutional_holders');
    }
};
