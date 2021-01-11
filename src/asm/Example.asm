.DATA	0x0
.TEXT	0x0
show_red_leds:			# vars = 0, regs to save($s#) = 0, outgoing args = 0, do not need to save return address
	addiu	$sp, $sp, -0
	sw	$a0, 0($sp)
	lui	$t0, 4095
	ori	$t0, $t0, 96
	lw	$t1, 0($sp)
	sw	$t1, 0($t0)
	addiu	$sp, $sp, 0
	jr	$ra
show_yellow_leds:			# vars = 0, regs to save($s#) = 0, outgoing args = 0, do not need to save return address
	addiu	$sp, $sp, -0
	sw	$a0, 0($sp)
	lui	$t0, 4095
	ori	$t0, $t0, 98
	lw	$t1, 0($sp)
	sw	$t1, 0($t0)
	addiu	$sp, $sp, 0
	jr	$ra
show_green_leds:			# vars = 0, regs to save($s#) = 0, outgoing args = 0, do not need to save return address
	addiu	$sp, $sp, -0
	sw	$a0, 0($sp)
	lui	$t0, 4095
	ori	$t0, $t0, 100
	lw	$t1, 0($sp)
	sw	$t1, 0($t0)
	addiu	$sp, $sp, 0
	jr	$ra
delay:			# vars = 1, regs to save($s#) = 0, outgoing args = 0, do not need to save return address
	addiu	$sp, $sp, -8
	sw	$a0, 8($sp)
	addiu	$t0, $zero, 10000
	sw	$t0, 4($sp)
_label_8_loop:
	addiu	$t0, $zero, 0
	lw	$t1, 4($sp)
	slt	$t2, $t0, $t1
	beq	$t2, $zero, _label_9_break
	nop
	addiu	$t0, $zero, 1
	lw	$t1, 4($sp)
	sub	$t2, $t1, $t0
	sw	$t2, 4($sp)
	j	_label_8_loop
	nop
_label_9_break:
	addiu	$sp, $sp, 8
	jr	$ra
get_switches_input:			# vars = 1, regs to save($s#) = 0, outgoing args = 0, do not need to save return address
	addiu	$sp, $sp, -8
	addiu	$t0, $zero, 0
	move	$v0, $t0
	sw	$t0, 4($sp)
	addiu	$sp, $sp, 8
	jr	$ra
main:			# vars = 4, regs to save($s#) = 0, outgoing args = 4, need to save return address
	addiu	$sp, $sp, -40
	sw	$ra, 36($sp)
_label_14_loop:
	addiu	$t0, $zero, 1
	beq	$t0, $zero, _label_15_break
	nop
	jal	get_switches_input
	move	$t0, $v0
	addiu	$t1, $zero, 16
	srlv	$t2, $t0, $t1
	addiu	$t3, $zero, 8
	srlv	$t4, $t0, $t3
	addiu	$t5, $zero, 0x000000ff
	and	$t6, $t4, $t5
	addiu	$t7, $zero, 0x000000ff
	and	$t8, $t0, $t7
	sw	$t0, 20($sp)
	sw	$t2, 24($sp)
	sw	$t6, 28($sp)
	sw	$t8, 32($sp)
	move	$a0, $t2
	jal	show_red_leds
	lw	$a0, 28($sp)
	jal	show_yellow_leds
	lw	$a0, 32($sp)
	jal	show_green_leds
	addiu	$t0, $zero, 100
	move	$a0, $t0
	jal	delay
	j	_label_14_loop
	nop
_label_15_break:
	addiu	$t0, $zero, 0
	move	$v0, $t0
	lw	$ra, 36($sp)
	addiu	$sp, $sp, 40
	jr	$ra